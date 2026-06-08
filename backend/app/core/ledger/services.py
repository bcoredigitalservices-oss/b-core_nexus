from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from sqlalchemy import select
from app.core.ledger.models import Transaction, LedgerEntry
from app.core.ledger.schemas import TransactionCreate, TransactionRead
from app.core.exceptions import CoreERPException
from decimal import Decimal
from collections import defaultdict

async def post_transaction(db: AsyncSession, transaction_data: TransactionCreate) -> TransactionRead:
    # 1. Financial Balance Guard
    total_amount = sum(line.amount for line in transaction_data.entries)
    if total_amount != Decimal("0"):
        raise CoreERPException(
            message="Transaction rejected: Financial ledger lines do not balance to zero.",
            error_code="TRANSACTION_UNBALANCED",
            status_code=400
        )

    # 2. Inventory Balance Guard
    item_quantities = defaultdict(Decimal)
    has_inventory_lines = False
    for line in transaction_data.entries:
        if line.item_id is not None:
            item_quantities[line.item_id] += line.quantity
            has_inventory_lines = True

    if has_inventory_lines:
        for item_id, total_qty in item_quantities.items():
            if total_qty != Decimal("0"):
                raise CoreERPException(
                    message=f"Transaction rejected: Inventory ledger quantities do not balance to zero.",
                    error_code="INVENTORY_UNBALANCED",
                    status_code=400
                )

    # Create Transaction record
    db_transaction = Transaction(
        transaction_number=transaction_data.transaction_number,
        posted_at=transaction_data.posted_at,
        workspace_source=transaction_data.workspace_source,
        description=transaction_data.description,
        metadata_payload=transaction_data.metadata_payload
    )
    db.add(db_transaction)
    await db.flush()  # Generate db_transaction.id

    # Create LedgerEntry records
    for line in transaction_data.entries:
        db_entry = LedgerEntry(
            transaction_id=db_transaction.id,
            account_or_location_code=line.account_or_location_code,
            entity_id=line.entity_id,
            item_id=line.item_id,
            quantity=line.quantity,
            amount=line.amount
        )
        db.add(db_entry)

    await db.flush()

    # Eagerly fetch the created transaction and nested entries to avoid lazy-loading exceptions
    stmt = (
        select(Transaction)
        .options(selectinload(Transaction.entries))
        .where(Transaction.id == db_transaction.id)
    )
    result = await db.execute(stmt)
    db_transaction_loaded = result.scalar_one()

    return TransactionRead.model_validate(db_transaction_loaded)
