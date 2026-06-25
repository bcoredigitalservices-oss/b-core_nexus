from decimal import Decimal
from uuid import UUID
from sqlalchemy.ext.asyncio import AsyncSession
from app.workspaces.inventory.models import StockLedger, StockTransactionType

async def process_stock_movement(
    db: AsyncSession,
    item_id: UUID,
    warehouse_id: UUID,
    qty: Decimal,
    txn_type: str,
    reference: str,
) -> StockLedger:
    """
    Cross-workspace API function to insert a row into inv_stock_ledger (StockLedger model).
    """
    entry = StockLedger(
        item_id=item_id,
        warehouse_id=warehouse_id,
        qty_change=qty,
        transaction_type=StockTransactionType(txn_type),
        reference_note=reference,
    )
    db.add(entry)
    await db.flush()
    return entry
