"""
Inventory Workspace — Router
==============================
All routes are protected by the `require_workspace_access("inventory")`
dependency applied at the router level, enforcing workspace-level isolation.

Mounted by the WorkspaceRegistry at: /api/v1/workspaces/inventory
"""

from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, select, case
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies.auth import require_workspace_access
from app.database import get_db

from app.workspaces.inventory.models import Item, Warehouse, StockLedger, StockTransactionType
from app.workspaces.inventory.schemas import (
    ItemCreate,
    ItemResponse,
    ItemUpdate,
    PaginatedItemsResponse,
    WarehouseCreate,
    WarehouseResponse,
    StockLedgerCreate,
    StockLedgerRead,
    StockAdjustmentPayload,
)

router = APIRouter(
    prefix="/inventory",
    tags=["Inventory"],
    dependencies=[Depends(require_workspace_access("inventory"))],
)

WORKSPACE_FEATURES = [
    "Inventory Management",
    "Stock Tracking",
    "Warehouse Management",
    "Purchase Orders",
    "Supplier Management",
]


# ─── Workspace Metadata ───────────────────────────────────────────────────────

@router.get("/meta", summary="Inventory Workspace Metadata")
async def get_inventory_meta():
    """Returns workspace status and feature manifest."""
    return {
        "workspace": "inventory",
        "status": "initialized",
        "accessible_features": WORKSPACE_FEATURES,
    }


# ══════════════════════════════════════════════════════════════════════════════
# Items
# ══════════════════════════════════════════════════════════════════════════════

@router.post(
    "/items",
    response_model=ItemResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new inventory item",
)
async def create_item(
    payload: ItemCreate,
    db: AsyncSession = Depends(get_db),
):
    """
    Register a new item in the inventory catalog.

    - SKU is normalised to UPPERCASE and must be globally unique within inv_items.
    - Uses `db.flush()` to surface constraint violations inside the transaction
      before committing, enabling clean rollback on duplicate SKU.
    """
    # Duplicate SKU guard
    existing = await db.execute(
        select(Item).where(Item.sku == payload.sku)
    )
    if existing.scalars().first():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"An item with SKU '{payload.sku}' already exists.",
        )

    item = Item(**payload.model_dump())
    db.add(item)

    # Flush inside transaction to catch DB-level constraint violations early
    await db.flush()
    await db.commit()
    await db.refresh(item)
    return item


@router.get(
    "/items",
    response_model=PaginatedItemsResponse,
    summary="List inventory items with pagination",
)
async def list_items(
    search: Optional[str] = Query(default=None, description="Filter by SKU or name (case-insensitive)"),
    item_group: Optional[str] = Query(default=None, description="Filter by item group"),
    is_active: Optional[bool] = Query(default=None, description="Filter by active status"),
    limit: int = Query(default=50, ge=1, le=500, description="Max records to return"),
    offset: int = Query(default=0, ge=0, description="Pagination cursor"),
    db: AsyncSession = Depends(get_db),
):
    """
    Returns a paginated list of inventory items with optional filters.
    The response envelope includes `total`, `limit`, `offset`, and `items[]`.
    """
    base_query = select(Item)

    if search:
        pattern = f"%{search}%"
        base_query = base_query.where(
            Item.sku.ilike(pattern) | Item.name.ilike(pattern)
        )
    if item_group is not None:
        base_query = base_query.where(Item.item_group == item_group)
    if is_active is not None:
        base_query = base_query.where(Item.is_active == is_active)

    # Count total (before pagination)
    count_result = await db.execute(
        select(func.count()).select_from(base_query.subquery())
    )
    total = count_result.scalar_one()

    # Paginated fetch
    paged_query = base_query.order_by(Item.name).offset(offset).limit(limit)
    result = await db.execute(paged_query)
    items = result.scalars().all()

    return PaginatedItemsResponse(
        total=total,
        limit=limit,
        offset=offset,
        items=items,  # type: ignore[arg-type]
    )


@router.get(
    "/items/{item_id}",
    response_model=ItemResponse,
    summary="Retrieve a single inventory item by UUID",
)
async def get_item(
    item_id: UUID,
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Item).where(Item.id == item_id))
    item = result.scalars().first()
    if not item:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Item not found.")
    return item


@router.patch(
    "/items/{item_id}",
    response_model=ItemResponse,
    summary="Partially update an inventory item",
)
async def update_item(
    item_id: UUID,
    payload: ItemUpdate,
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Item).where(Item.id == item_id))
    item = result.scalars().first()
    if not item:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Item not found.")

    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(item, field, value)

    await db.flush()
    await db.commit()
    await db.refresh(item)
    return item


# ══════════════════════════════════════════════════════════════════════════════
# Warehouses
# ══════════════════════════════════════════════════════════════════════════════

@router.post(
    "/warehouses",
    response_model=WarehouseResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Register a new warehouse",
)
async def create_warehouse(
    payload: WarehouseCreate,
    db: AsyncSession = Depends(get_db),
):
    existing = await db.execute(
        select(Warehouse).where(Warehouse.name == payload.name)
    )
    if existing.scalars().first():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Warehouse '{payload.name}' already exists.",
        )

    warehouse = Warehouse(**payload.model_dump())
    db.add(warehouse)
    await db.flush()
    await db.commit()
    await db.refresh(warehouse)
    return warehouse


@router.get(
    "/warehouses",
    response_model=list[WarehouseResponse],
    summary="List all warehouses",
)
async def list_warehouses(
    is_active: Optional[bool] = Query(default=None),
    db: AsyncSession = Depends(get_db),
):
    query = select(Warehouse).order_by(Warehouse.name)
    if is_active is not None:
        query = query.where(Warehouse.is_active == is_active)
    result = await db.execute(query)
    return result.scalars().all()


# ══════════════════════════════════════════════════════════════════════════════
# Stock Ledger
# ══════════════════════════════════════════════════════════════════════════════

@router.post(
    "/stock-ledger",
    response_model=StockLedgerRead,
    status_code=status.HTTP_201_CREATED,
    summary="Record a stock movement (IN or OUT)",
)
async def record_stock_movement(
    payload: StockLedgerCreate,
    db: AsyncSession = Depends(get_db),
):
    """
    Posts an immutable stock ledger entry. Validates that both
    the referenced Item and Warehouse exist before committing.
    """
    # Validate item exists
    item_check = await db.execute(
        select(Item).where(Item.id == payload.item_id)
    )
    if not item_check.scalars().first():
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Item not found.")

    # Validate warehouse exists
    wh_check = await db.execute(
        select(Warehouse).where(Warehouse.id == payload.warehouse_id)
    )
    if not wh_check.scalars().first():
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Warehouse not found.")

    entry = StockLedger(**payload.model_dump())
    db.add(entry)
    await db.flush()
    await db.commit()
    await db.refresh(entry)
    return entry


@router.get(
    "/stock-ledger",
    response_model=list[StockLedgerRead],
    summary="Query stock ledger entries",
)
async def list_stock_ledger(
    item_id: Optional[UUID] = Query(default=None),
    warehouse_id: Optional[UUID] = Query(default=None),
    limit: int = Query(default=50, ge=1, le=500),
    offset: int = Query(default=0, ge=0),
    db: AsyncSession = Depends(get_db),
):
    query = select(StockLedger).order_by(StockLedger.timestamp.desc())
    if item_id:
        query = query.where(StockLedger.item_id == item_id)
    if warehouse_id:
        query = query.where(StockLedger.warehouse_id == warehouse_id)
    query = query.offset(offset).limit(limit)
    result = await db.execute(query)
    return result.scalars().all()


@router.post(
    "/stock/adjust",
    response_model=list[StockLedgerRead],
    status_code=status.HTTP_201_CREATED,
    summary="Record a stock adjustment or transfer",
)
async def adjust_stock(
    payload: StockAdjustmentPayload,
    db: AsyncSession = Depends(get_db),
):
    """
    Record inventory adjustments (IN, OUT) or TRANSFER movements.
    Uses double-entry bookkeeping for TRANSFER to subtract from source and add to destination.
    """
    # 1. Validate Item exists
    item_res = await db.execute(select(Item).where(Item.id == payload.item_id))
    item = item_res.scalars().first()
    if not item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Item with ID '{payload.item_id}' not found.",
        )

    # 2. Validate target Warehouse exists
    wh_res = await db.execute(select(Warehouse).where(Warehouse.id == payload.warehouse_id))
    target_warehouse = wh_res.scalars().first()
    if not target_warehouse:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Warehouse with ID '{payload.warehouse_id}' not found.",
        )

    entries = []

    if payload.transaction_type == "TRANSFER":
        if not payload.source_warehouse_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="source_warehouse_id is required when transaction_type is TRANSFER.",
            )
        if payload.source_warehouse_id == payload.warehouse_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Source and destination warehouses must be different for TRANSFER.",
            )
        src_res = await db.execute(select(Warehouse).where(Warehouse.id == payload.source_warehouse_id))
        source_warehouse = src_res.scalars().first()
        if not source_warehouse:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Source warehouse with ID '{payload.source_warehouse_id}' not found.",
            )

        # Create OUT entry from source
        out_entry = StockLedger(
            item_id=payload.item_id,
            warehouse_id=payload.source_warehouse_id,
            qty_change=payload.qty_change,
            transaction_type=StockTransactionType.OUT,
            reference_note=f"Transfer to {target_warehouse.name}. {payload.reference_note or ''}".strip(),
            custom_attributes=payload.custom_attributes,
        )
        # Create IN entry to destination
        in_entry = StockLedger(
            item_id=payload.item_id,
            warehouse_id=payload.warehouse_id,
            qty_change=payload.qty_change,
            transaction_type=StockTransactionType.IN,
            reference_note=f"Transfer from {source_warehouse.name}. {payload.reference_note or ''}".strip(),
            custom_attributes=payload.custom_attributes,
        )
        db.add(out_entry)
        db.add(in_entry)
        entries.extend([out_entry, in_entry])

    elif payload.transaction_type == "IN":
        in_entry = StockLedger(
            item_id=payload.item_id,
            warehouse_id=payload.warehouse_id,
            qty_change=payload.qty_change,
            transaction_type=StockTransactionType.IN,
            reference_note=payload.reference_note,
            custom_attributes=payload.custom_attributes,
        )
        db.add(in_entry)
        entries.append(in_entry)

    elif payload.transaction_type == "OUT":
        out_entry = StockLedger(
            item_id=payload.item_id,
            warehouse_id=payload.warehouse_id,
            qty_change=payload.qty_change,
            transaction_type=StockTransactionType.OUT,
            reference_note=payload.reference_note,
            custom_attributes=payload.custom_attributes,
        )
        db.add(out_entry)
        entries.append(out_entry)

    # Use strict db.flush() inside transaction block
    await db.flush()
    await db.commit()

    # Refresh all created entries
    for entry in entries:
        await db.refresh(entry)

    return entries


@router.get(
    "/stock/levels",
    summary="Retrieve live stock levels aggregated by item and warehouse",
)
async def get_stock_levels(
    db: AsyncSession = Depends(get_db),
):
    """
    Query the StockLedger table and group by item_id and warehouse_id.
    Calculates the current real-time quantity by summing 'IN' and subtracting 'OUT' transactions.
    """
    stmt = (
        select(
            Item.name.label("item_name"),
            Item.sku.label("sku"),
            Warehouse.name.label("warehouse_name"),
            func.sum(
                case(
                    (StockLedger.transaction_type == StockTransactionType.IN, StockLedger.qty_change),
                    else_=-StockLedger.qty_change,
                )
            ).label("current_qty"),
        )
        .join(Item, StockLedger.item_id == Item.id)
        .join(Warehouse, StockLedger.warehouse_id == Warehouse.id)
        .group_by(Item.id, Item.name, Item.sku, Warehouse.id, Warehouse.name)
    )

    result = await db.execute(stmt)
    rows = result.all()

    return [
        {
            "item_name": row.item_name,
            "sku": row.sku,
            "warehouse_name": row.warehouse_name,
            "current_qty": float(row.current_qty) if row.current_qty is not None else 0.0,
        }
        for row in rows
    ]
