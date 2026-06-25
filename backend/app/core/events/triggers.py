import uuid
import json
from decimal import Decimal
from datetime import date
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload

from app.database import AsyncSessionLocal
from app.core.events.websocket import ws_manager

async def process_sales_order_fulfillment(order_id: uuid.UUID):
    """
    Background automation trigger:
    When a Sales Order is FULFILLED:
      1. Deduts item quantity from inventory StockLedger ('OUT' transaction).
      2. Creates a balanced JournalEntry (Debit Cost of Goods Sold, Credit Inventory Asset).
      3. Dispatches WebSockets STATE_MUTATION broadcast to CRM, Inventory, and Finance workspaces.
    """
    from app.workspaces.crm.models import SalesOrder, SalesOrderStatus
    from app.workspaces.inventory.models import StockLedger, StockTransactionType, Warehouse
    from app.workspaces.finance.models import Account, AccountType, JournalEntry, JournalEntryLine, JournalEntryStatus

    print(f"[Trigger] Executing sales order fulfillment automation for order: {order_id}")
    async with AsyncSessionLocal() as db:
        # 1. Fetch Sales Order with lines
        order_res = await db.execute(
            select(SalesOrder)
            .options(selectinload(SalesOrder.lines))
            .filter(SalesOrder.id == order_id)
        )
        order = order_res.scalars().first()
        if not order:
            print(f"[Trigger ERROR] Sales Order {order_id} not found.")
            return

        if order.status != SalesOrderStatus.FULFILLED:
            print(f"[Trigger SKIP] Sales Order {order.order_reference} status is {order.status}, not FULFILLED.")
            return

        # 2. Get or create active Warehouse location for stock deduction
        wh_res = await db.execute(select(Warehouse).filter(Warehouse.is_active == True))
        warehouse = wh_res.scalars().first()
        if not warehouse:
            warehouse = Warehouse(
                name="Central Fulfillment Warehouse",
                location_address="Internal Operations HQ",
                is_active=True
            )
            db.add(warehouse)
            await db.flush()

        # 3. Create StockLedger OUT entries for each order line item
        for line in order.lines:
            ledger_entry = StockLedger(
                item_id=line.item_id,
                warehouse_id=warehouse.id,
                qty_change=Decimal(str(line.quantity)),
                transaction_type=StockTransactionType.OUT,
                reference_note=f"Auto SO Fulfill: {order.order_reference}"
            )
            db.add(ledger_entry)

        # 4. Get/Seed general ledger Accounts
        # Debit: Cost of Goods Sold (5100 - EXPENSE)
        cogs_res = await db.execute(select(Account).filter(Account.account_code == "5100"))
        cogs_acct = cogs_res.scalars().first()
        if not cogs_acct:
            cogs_acct = Account(
                account_code="5100",
                account_name="Cost of Goods Sold",
                account_type=AccountType.EXPENSE,
                is_active=True
            )
            db.add(cogs_acct)
            await db.flush()

        # Credit: Inventory Asset (1200 - ASSET)
        asset_res = await db.execute(select(Account).filter(Account.account_code == "1200"))
        asset_acct = asset_res.scalars().first()
        if not asset_acct:
            asset_acct = Account(
                account_code="1200",
                account_name="Inventory Asset",
                account_type=AccountType.ASSET,
                is_active=True
            )
            db.add(asset_acct)
            await db.flush()

        # 5. Create balanced JournalEntry
        je_ref = f"JE-FULFILL-{order.order_reference}"
        je_check = await db.execute(select(JournalEntry).filter(JournalEntry.reference_number == je_ref))
        if je_check.scalars().first():
            print(f"[Trigger SKIP] Journal Entry {je_ref} already exists.")
            return

        je = JournalEntry(
            entry_date=order.order_date or date.today(),
            description=f"Sales Order Fulfillment: {order.order_reference}",
            reference_number=je_ref,
            status=JournalEntryStatus.POSTED
        )
        db.add(je)
        await db.flush()

        # 6. Insert JournalEntryLines
        total_val = Decimal(str(order.grand_total))
        
        # Debit Cost of Goods Sold
        debit_line = JournalEntryLine(
            journal_entry_id=je.id,
            account_id=cogs_acct.id,
            debit=total_val,
            credit=Decimal("0.0")
        )
        # Credit Inventory Asset
        credit_line = JournalEntryLine(
            journal_entry_id=je.id,
            account_id=asset_acct.id,
            debit=Decimal("0.0"),
            credit=total_val
        )
        db.add(debit_line)
        db.add(credit_line)

        # 7. Commit changes to Database
        await db.commit()
        print(f"[Trigger SUCCESS] Fulfilled order {order.order_reference} and updated Stock Ledger/GL.")

    # 8. Broadcast UI mutation notifications
    crm_msg = {
        "event_type": "STATE_MUTATION",
        "payload": {
            "workspace": "crm",
            "entity": "sales_order",
            "action": "fulfilled",
            "order_id": str(order_id),
            "reference": order.order_reference
        }
    }
    inv_msg = {
        "event_type": "STATE_MUTATION",
        "payload": {
            "workspace": "inventory",
            "entity": "stock_ledger",
            "action": "updated"
        }
    }
    fin_msg = {
        "event_type": "STATE_MUTATION",
        "payload": {
            "workspace": "finance",
            "entity": "journal_entry",
            "action": "posted"
        }
    }

    await ws_manager.broadcast_to_workspace("crm", crm_msg)
    await ws_manager.broadcast_to_workspace("inventory", inv_msg)
    await ws_manager.broadcast_to_workspace("finance", fin_msg)
