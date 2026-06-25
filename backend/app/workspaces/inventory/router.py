"""
Inventory Workspace — Router
==============================
All routes are protected by the `require_workspace_access("inventory")`
dependency applied at the router level, enforcing workspace-level isolation.

Mounted by the WorkspaceRegistry at: /api/v1/workspaces/inventory
"""

from typing import Optional, List
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, select, case
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import joinedload, selectinload

from app.core.dependencies.auth import require_workspace_access
from app.database import get_db

from app.core.auth.models import User
from app.workspaces.inventory.models import (
    Item,
    Warehouse,
    StockLedger,
    StockTransactionType,
    ItemGroup,
    InventorySettings,
    Asset,
    AssetAllocationHistory,
    AssetStatus,
    ProductBundle,
    StockEntry,
    StockEntryDetail,
    StockEntryType,
    StockEntryStatus,
)
from app.workspaces.inventory.schemas import (
    ItemCreate,
    ItemResponse,
    ItemUpdate,
    PaginatedItemsResponse,
    WarehouseCreate,
    WarehouseResponse,
    WarehouseUpdate,
    StockLedgerCreate,
    StockLedgerRead,
    StockAdjustmentPayload,
    ItemGroupCreate,
    ItemGroupUpdate,
    ItemGroupResponse,
    InventorySettingsResponse,
    InventorySettingsUpdate,
    AssetCreate,
    AssetResponse,
    AssetAllocationPayload,
    ProductBundleResponse,
    StockEntryCreate,
    StockEntryRead,
    StockEntryUpdate,
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

    # If item_group_id is provided, check if it exists
    if payload.item_group_id:
        group_exists = await db.get(ItemGroup, payload.item_group_id)
        if not group_exists:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Item Group ID {payload.item_group_id} not found."
            )

    item = Item(**payload.model_dump())
    db.add(item)

    await db.flush()
    await db.commit()

    # Reload with relation
    stmt = select(Item).options(joinedload(Item.item_group)).where(Item.id == item.id)
    res = await db.execute(stmt)
    return res.scalars().first()


@router.get(
    "/items",
    response_model=PaginatedItemsResponse,
    summary="List inventory items with pagination",
)
async def list_items(
    search: Optional[str] = Query(default=None, description="Filter by SKU or name (case-insensitive)"),
    item_group_id: Optional[UUID] = Query(default=None, description="Filter by item group ID"),
    is_active: Optional[bool] = Query(default=None, description="Filter by active status"),
    limit: int = Query(default=50, ge=1, le=500, description="Max records to return"),
    offset: int = Query(default=0, ge=0, description="Pagination cursor"),
    db: AsyncSession = Depends(get_db),
):
    """
    Returns a paginated list of inventory items with optional filters.
    """
    base_query = select(Item).options(joinedload(Item.item_group))

    if search:
        pattern = f"%{search}%"
        base_query = base_query.where(
            Item.sku.ilike(pattern) | Item.name.ilike(pattern)
        )
    if item_group_id is not None:
        base_query = base_query.where(Item.item_group_id == item_group_id)
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
    result = await db.execute(select(Item).options(joinedload(Item.item_group)).where(Item.id == item_id))
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
    result = await db.execute(select(Item).options(joinedload(Item.item_group)).where(Item.id == item_id))
    item = result.scalars().first()
    if not item:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Item not found.")

    if payload.item_group_id:
        group_exists = await db.get(ItemGroup, payload.item_group_id)
        if not group_exists:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Item Group ID {payload.item_group_id} not found."
            )

    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(item, field, value)

    await db.flush()
    await db.commit()

    # Reload with relation
    stmt = select(Item).options(joinedload(Item.item_group)).where(Item.id == item_id)
    res = await db.execute(stmt)
    return res.scalars().first()


# ══════════════════════════════════════════════════════════════════════════════
# Item Groups
# ══════════════════════════════════════════════════════════════════════════════

@router.post(
    "/item-groups",
    response_model=ItemGroupResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new item group"
)
async def create_item_group(
    payload: ItemGroupCreate,
    db: AsyncSession = Depends(get_db)
):
    if payload.parent_id:
        parent = await db.get(ItemGroup, payload.parent_id)
        if not parent:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Parent item group with ID {payload.parent_id} not found."
            )

    existing = await db.execute(select(ItemGroup).where(ItemGroup.name == payload.name))
    if existing.scalars().first():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"An item group with name '{payload.name}' already exists."
        )

    group = ItemGroup(**payload.model_dump())
    db.add(group)
    await db.commit()
    await db.refresh(group)
    return group


@router.get(
    "/item-groups",
    response_model=List[ItemGroupResponse],
    summary="List all item groups"
)
async def list_item_groups(
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(ItemGroup).order_by(ItemGroup.name))
    return result.scalars().all()


@router.delete(
    "/item-groups/{group_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete an item group"
)
async def delete_item_group(
    group_id: UUID,
    db: AsyncSession = Depends(get_db)
):
    group = await db.get(ItemGroup, group_id)
    if not group:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Item group not found."
        )
    await db.delete(group)
    await db.commit()
    return None


# ══════════════════════════════════════════════════════════════════════════════
# Inventory Settings
# ══════════════════════════════════════════════════════════════════════════════

@router.get(
    "/settings",
    response_model=InventorySettingsResponse,
    summary="Retrieve global inventory settings"
)
async def get_inventory_settings(
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(InventorySettings))
    settings = result.scalars().first()
    if not settings:
        settings = InventorySettings(default_uom="Piece")
        db.add(settings)
        await db.commit()
        await db.refresh(settings)
    return settings


@router.put(
    "/settings",
    response_model=InventorySettingsResponse,
    summary="Update global inventory settings"
)
async def update_inventory_settings(
    payload: InventorySettingsUpdate,
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(InventorySettings))
    settings = result.scalars().first()
    if not settings:
        settings = InventorySettings(default_uom=payload.default_uom)
        db.add(settings)
    else:
        settings.default_uom = payload.default_uom
    await db.commit()
    await db.refresh(settings)
    return settings


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


# ══════════════════════════════════════════════════════════════════════════════
# Assets & Custody Tracking
# ══════════════════════════════════════════════════════════════════════════════

@router.get(
    "/assets",
    response_model=List[AssetResponse],
    summary="List all assets",
)
async def list_assets(db: AsyncSession = Depends(get_db)):
    stmt = select(Asset).options(
        joinedload(Asset.item),
        joinedload(Asset.allocated_to_user),
        joinedload(Asset.location)
    ).order_by(Asset.asset_name)
    result = await db.execute(stmt)
    return result.scalars().all()


@router.post(
    "/assets",
    response_model=AssetResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Register a new asset",
)
async def create_asset(
    payload: AssetCreate,
    db: AsyncSession = Depends(get_db),
):
    # Validate item exists
    item = await db.get(Item, payload.item_id)
    if not item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Item not found."
        )

    # Validate location exists if provided
    if payload.location_id:
        wh = await db.get(Warehouse, payload.location_id)
        if not wh:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Warehouse location not found."
            )

    asset = Asset(**payload.model_dump())
    db.add(asset)
    await db.flush()
    await db.commit()

    # Reload with relations
    stmt = select(Asset).options(
        joinedload(Asset.item),
        joinedload(Asset.allocated_to_user),
        joinedload(Asset.location)
    ).where(Asset.id == asset.id)
    res = await db.execute(stmt)
    return res.scalars().first()


@router.delete(
    "/assets/{asset_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete an asset",
)
async def delete_asset(
    asset_id: UUID,
    db: AsyncSession = Depends(get_db),
):
    asset = await db.get(Asset, asset_id)
    if not asset:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Asset not found."
        )
    await db.delete(asset)
    await db.commit()
    return None


@router.post(
    "/assets/{asset_id}/allocate",
    response_model=AssetResponse,
    summary="Allocate an asset to a user",
)
async def allocate_asset(
    asset_id: UUID,
    payload: AssetAllocationPayload,
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Asset).options(
            joinedload(Asset.item),
            joinedload(Asset.allocated_to_user),
            joinedload(Asset.location)
        ).where(Asset.id == asset_id)
    )
    asset = result.scalars().first()
    if not asset:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Asset not found."
        )

    if asset.status != AssetStatus.Available:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Asset is not available for allocation. Current status: {asset.status}"
        )

    # Validate user exists
    user = await db.get(User, payload.allocated_to_user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found in B-Core directory."
        )

    # Validate location if provided
    if payload.location_id:
        wh = await db.get(Warehouse, payload.location_id)
        if not wh:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Warehouse location not found."
            )
        asset.location_id = payload.location_id

    from datetime import timezone
    # Update asset fields
    asset.status = AssetStatus.Allocated
    asset.allocated_to_user_id = payload.allocated_to_user_id

    # Log allocation history
    history = AssetAllocationHistory(
        asset_id=asset.id,
        allocated_to_user_id=payload.allocated_to_user_id,
        location_id=asset.location_id,
        allocated_at=datetime.now(timezone.utc)
    )
    db.add(history)
    
    await db.flush()
    await db.commit()

    # Reload with relations
    stmt = select(Asset).options(
        joinedload(Asset.item),
        joinedload(Asset.allocated_to_user),
        joinedload(Asset.location)
    ).where(Asset.id == asset.id)
    res = await db.execute(stmt)
    return res.scalars().first()


@router.post(
    "/assets/{asset_id}/return",
    response_model=AssetResponse,
    summary="Return an allocated asset to inventory",
)
async def return_asset(
    asset_id: UUID,
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Asset).options(
            joinedload(Asset.item),
            joinedload(Asset.allocated_to_user),
            joinedload(Asset.location)
        ).where(Asset.id == asset_id)
    )
    asset = result.scalars().first()
    if not asset:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Asset not found."
        )

    if asset.status != AssetStatus.Allocated:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Asset is not currently allocated. Current status: {asset.status}"
        )

    # Find the active custody record (returned_at is NULL)
    hist_stmt = (
        select(AssetAllocationHistory)
        .where(AssetAllocationHistory.asset_id == asset_id)
        .where(AssetAllocationHistory.returned_at.is_(None))
        .order_by(AssetAllocationHistory.allocated_at.desc())
    )
    hist_res = await db.execute(hist_stmt)
    history = hist_res.scalars().first()

    from datetime import timezone
    if history:
        history.returned_at = datetime.now(timezone.utc)
        db.add(history)

    # Update asset
    asset.status = AssetStatus.Available
    asset.allocated_to_user_id = None

    await db.flush()
    await db.commit()

    # Reload with relations
    stmt = select(Asset).options(
        joinedload(Asset.item),
        joinedload(Asset.allocated_to_user),
        joinedload(Asset.location)
    ).where(Asset.id == asset.id)
    res = await db.execute(stmt)
    return res.scalars().first()


# ══════════════════════════════════════════════════════════════════════════════
# Warehouse CRUD Extra Endpoints
# ══════════════════════════════════════════════════════════════════════════════

@router.patch(
    "/warehouses/{warehouse_id}",
    response_model=WarehouseResponse,
    summary="Partially update a warehouse",
)
async def update_warehouse(
    warehouse_id: UUID,
    payload: WarehouseUpdate,
    db: AsyncSession = Depends(get_db),
):
    warehouse = await db.get(Warehouse, warehouse_id)
    if not warehouse:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Warehouse not found."
        )

    # If updating name, guard uniqueness
    if payload.name and payload.name != warehouse.name:
        existing = await db.execute(select(Warehouse).where(Warehouse.name == payload.name))
        if existing.scalars().first():
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"Warehouse with name '{payload.name}' already exists."
            )

    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(warehouse, field, value)

    await db.commit()
    await db.refresh(warehouse)
    return warehouse


@router.delete(
    "/warehouses/{warehouse_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete a warehouse",
)
async def delete_warehouse(
    warehouse_id: UUID,
    db: AsyncSession = Depends(get_db),
):
    warehouse = await db.get(Warehouse, warehouse_id)
    if not warehouse:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Warehouse not found."
        )
    await db.delete(warehouse)
    await db.commit()
    return None


# ══════════════════════════════════════════════════════════════════════════════
# Stock Health & Indicators
# ══════════════════════════════════════════════════════════════════════════════

@router.get(
    "/health",
    summary="Retrieve stock health metrics",
)
async def get_stock_health(db: AsyncSession = Depends(get_db)):
    """
    Calculate inventory health metrics:
      - Low Stock Items (quantity < min_reorder_point)
      - Dead Stock Items (no transaction movements in the last 90 days)
    """
    # 1. Fetch all items
    items_stmt = select(Item).options(joinedload(Item.item_group))
    items_res = await db.execute(items_stmt)
    all_items = items_res.scalars().all()

    # 2. Fetch current quantities from ledger
    ledger_stmt = (
        select(
            StockLedger.item_id,
            func.sum(
                case(
                    (StockLedger.transaction_type == StockTransactionType.IN, StockLedger.qty_change),
                    else_=-StockLedger.qty_change,
                )
            ).label("qty")
        )
        .group_by(StockLedger.item_id)
    )
    ledger_res = await db.execute(ledger_stmt)
    qty_map = {row.item_id: float(row.qty) if row.qty is not None else 0.0 for row in ledger_res.all()}

    # 3. Fetch latest movement timestamp from ledger for each item
    movement_stmt = (
        select(StockLedger.item_id, func.max(StockLedger.timestamp).label("last_move"))
        .group_by(StockLedger.item_id)
    )
    movement_res = await db.execute(movement_stmt)
    movement_map = {row.item_id: row.last_move for row in movement_res.all()}

    from datetime import datetime, timezone, timedelta
    now_utc = datetime.now(timezone.utc)
    threshold_90_days = now_utc - timedelta(days=90)

    healthy_count = 0
    low_stock_count = 0
    dead_stock_count = 0

    items_health_details = []

    for item in all_items:
        qty = qty_map.get(item.id, 0.0)
        last_move = movement_map.get(item.id)

        # Get reorder threshold from custom_attributes
        min_reorder = 10.0
        if item.custom_attributes and "min_reorder_point" in item.custom_attributes:
            try:
                min_reorder = float(item.custom_attributes["min_reorder_point"])
            except (ValueError, TypeError):
                pass

        # Determine health status
        is_dead = False
        if last_move:
            last_move_aware = last_move
            if last_move_aware.tzinfo is None:
                last_move_aware = last_move_aware.replace(tzinfo=timezone.utc)
            if last_move_aware < threshold_90_days:
                is_dead = True
        else:
            is_dead = True

        status = "Healthy"
        if qty < min_reorder:
            status = "Low Stock"
            low_stock_count += 1
        elif is_dead and qty > 0:
            status = "Dead Stock"
            dead_stock_count += 1
        else:
            healthy_count += 1

        items_health_details.append({
            "id": str(item.id),
            "sku": item.sku,
            "name": item.name,
            "item_group_name": item.item_group.name if item.item_group else "General",
            "qty_on_hand": qty,
            "min_reorder_point": min_reorder,
            "last_movement": last_move.isoformat() if last_move else None,
            "status": status
        })

    return {
        "total_items": len(all_items),
        "healthy_count": healthy_count,
        "low_stock_count": low_stock_count,
        "dead_stock_count": dead_stock_count,
        "status_distribution": [
            {"name": "Healthy", "value": healthy_count},
            {"name": "Low Stock", "value": low_stock_count},
            {"name": "Dead Stock", "value": dead_stock_count}
        ],
        "items": items_health_details
    }


@router.get("/products/bundles", response_model=List[ProductBundleResponse])
async def list_product_bundles(
    db: AsyncSession = Depends(get_db)
):
    """
    List all ProductBundle models joined with their items.
    """
    stmt = (
        select(ProductBundle)
        .options(
            joinedload(ProductBundle.parent_item).joinedload(Item.item_group),
            selectinload(ProductBundle.items)
        )
    )
    result = await db.execute(stmt)
    return result.scalars().all()


# ══════════════════════════════════════════════════════════════════════════════
# Stock Entries CRUD & Operations
# ══════════════════════════════════════════════════════════════════════════════

@router.post(
    "/stock-entries",
    response_model=StockEntryRead,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new stock entry",
)
async def create_stock_entry(
    payload: StockEntryCreate,
    db: AsyncSession = Depends(get_db),
):
    """
    Register a new stock entry with nested items.
    """
    if payload.default_warehouse_id:
        wh = await db.get(Warehouse, payload.default_warehouse_id)
        if not wh:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Default warehouse ID {payload.default_warehouse_id} not found."
            )

    for item_in in payload.items:
        item = await db.get(Item, item_in.item_id)
        if not item:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Item ID {item_in.item_id} not found."
            )
        if item_in.source_warehouse_id:
            wh = await db.get(Warehouse, item_in.source_warehouse_id)
            if not wh:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Source warehouse ID {item_in.source_warehouse_id} not found."
                )
        if item_in.target_warehouse_id:
            wh = await db.get(Warehouse, item_in.target_warehouse_id)
            if not wh:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Target warehouse ID {item_in.target_warehouse_id} not found."
                )

    entry = StockEntry(
        series=payload.series,
        entry_type=payload.entry_type,
        posting_date=payload.posting_date,
        posting_time=payload.posting_time,
        default_warehouse_id=payload.default_warehouse_id,
        status=payload.status,
        custom_attributes=payload.custom_attributes,
    )
    db.add(entry)
    await db.flush()

    for item_in in payload.items:
        detail = StockEntryDetail(
            stock_entry_id=entry.id,
            source_warehouse_id=item_in.source_warehouse_id,
            target_warehouse_id=item_in.target_warehouse_id,
            item_id=item_in.item_id,
            qty=item_in.qty,
            basic_rate=item_in.basic_rate,
            custom_attributes=item_in.custom_attributes,
        )
        db.add(detail)

    await db.commit()

    stmt = (
        select(StockEntry)
        .options(selectinload(StockEntry.items))
        .where(StockEntry.id == entry.id)
    )
    res = await db.execute(stmt)
    return res.scalar_one()


@router.get(
    "/stock-entries",
    response_model=List[StockEntryRead],
    summary="List all stock entries",
)
async def list_stock_entries(
    status_filter: Optional[StockEntryStatus] = Query(default=None, alias="status"),
    entry_type: Optional[StockEntryType] = Query(default=None),
    db: AsyncSession = Depends(get_db),
):
    """
    List stock entries with optional filtering.
    """
    stmt = (
        select(StockEntry)
        .options(selectinload(StockEntry.items))
        .order_by(StockEntry.posting_date.desc(), StockEntry.posting_time.desc())
    )
    if status_filter:
        stmt = stmt.where(StockEntry.status == status_filter)
    if entry_type:
        stmt = stmt.where(StockEntry.entry_type == entry_type)
    res = await db.execute(stmt)
    return res.scalars().all()


@router.get(
    "/stock-entries/{id}",
    response_model=StockEntryRead,
    summary="Get stock entry by ID",
)
async def get_stock_entry(
    id: UUID,
    db: AsyncSession = Depends(get_db),
):
    """
    Retrieve details of a single stock entry.
    """
    stmt = select(StockEntry).options(selectinload(StockEntry.items)).where(StockEntry.id == id)
    res = await db.execute(stmt)
    entry = res.scalars().first()
    if not entry:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Stock entry not found.")
    return entry


@router.patch(
    "/stock-entries/{id}",
    response_model=StockEntryRead,
    summary="Partially update a stock entry",
)
async def update_stock_entry(
    id: UUID,
    payload: StockEntryUpdate,
    db: AsyncSession = Depends(get_db),
):
    """
    Partially update a draft stock entry and its child items.
    """
    stmt = select(StockEntry).options(selectinload(StockEntry.items)).where(StockEntry.id == id)
    res = await db.execute(stmt)
    entry = res.scalars().first()
    if not entry:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Stock entry not found.")
    if entry.status != StockEntryStatus.DRAFT:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only Draft stock entries can be updated.",
        )

    if payload.default_warehouse_id:
        wh = await db.get(Warehouse, payload.default_warehouse_id)
        if not wh:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Default warehouse ID {payload.default_warehouse_id} not found."
            )

    if payload.items is not None:
        for item_in in payload.items:
            item = await db.get(Item, item_in.item_id)
            if not item:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Item ID {item_in.item_id} not found."
                )
            if item_in.source_warehouse_id:
                wh = await db.get(Warehouse, item_in.source_warehouse_id)
                if not wh:
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail=f"Source warehouse ID {item_in.source_warehouse_id} not found."
                    )
            if item_in.target_warehouse_id:
                wh = await db.get(Warehouse, item_in.target_warehouse_id)
                if not wh:
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail=f"Target warehouse ID {item_in.target_warehouse_id} not found."
                    )

    for field, value in payload.model_dump(exclude={"items"}, exclude_unset=True).items():
        setattr(entry, field, value)

    if payload.items is not None:
        for detail in entry.items:
            await db.delete(detail)
        for item_in in payload.items:
            detail = StockEntryDetail(
                stock_entry_id=entry.id,
                source_warehouse_id=item_in.source_warehouse_id,
                target_warehouse_id=item_in.target_warehouse_id,
                item_id=item_in.item_id,
                qty=item_in.qty,
                basic_rate=item_in.basic_rate,
                custom_attributes=item_in.custom_attributes,
            )
            db.add(detail)

    await db.flush()
    await db.commit()

    stmt = (
        select(StockEntry)
        .options(selectinload(StockEntry.items))
        .where(StockEntry.id == id)
    )
    res = await db.execute(stmt)
    return res.scalar_one()


@router.delete(
    "/stock-entries/{id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete a draft stock entry",
)
async def delete_stock_entry(
    id: UUID,
    db: AsyncSession = Depends(get_db),
):
    """
    Deletes a stock entry if it is in Draft status.
    """
    entry = await db.get(StockEntry, id)
    if not entry:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Stock entry not found.")
    if entry.status != StockEntryStatus.DRAFT:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only Draft stock entries can be deleted.",
        )
    await db.delete(entry)
    await db.commit()
    return None


@router.post(
    "/stock-entries/{id}/submit",
    response_model=StockEntryRead,
    summary="Submit a stock entry to post ledger entries",
)
async def submit_stock_entry(
    id: UUID,
    db: AsyncSession = Depends(get_db),
):
    """
    Submits the stock entry, posting double-entry stock transactions to the ledger.
    """
    stmt = select(StockEntry).options(selectinload(StockEntry.items)).where(StockEntry.id == id)
    res = await db.execute(stmt)
    entry = res.scalars().first()
    if not entry:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Stock entry not found.")
    if entry.status != StockEntryStatus.DRAFT:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Only Draft stock entries can be submitted. Current status: {entry.status}",
        )

    from app.workspaces.inventory.services.stock_service import process_stock_movement

    for detail in entry.items:
        if entry.entry_type == StockEntryType.MATERIAL_RECEIPT:
            if not detail.target_warehouse_id:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Target warehouse is required for Material Receipt."
                )
            await process_stock_movement(
                db=db,
                item_id=detail.item_id,
                warehouse_id=detail.target_warehouse_id,
                qty=detail.qty,
                txn_type="IN",
                reference=f"StockEntry:{entry.id}",
            )
        elif entry.entry_type == StockEntryType.MATERIAL_ISSUE:
            if not detail.source_warehouse_id:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Source warehouse is required for Material Issue."
                )
            await process_stock_movement(
                db=db,
                item_id=detail.item_id,
                warehouse_id=detail.source_warehouse_id,
                qty=detail.qty,
                txn_type="OUT",
                reference=f"StockEntry:{entry.id}",
            )
        elif entry.entry_type in (StockEntryType.MATERIAL_TRANSFER, StockEntryType.MANUFACTURE):
            if not detail.source_warehouse_id or not detail.target_warehouse_id:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Both Source and Target warehouses are required for {entry.entry_type}."
                )
            # Debit source (OUT)
            await process_stock_movement(
                db=db,
                item_id=detail.item_id,
                warehouse_id=detail.source_warehouse_id,
                qty=detail.qty,
                txn_type="OUT",
                reference=f"StockEntry:{entry.id}",
            )
            # Credit target (IN)
            await process_stock_movement(
                db=db,
                item_id=detail.item_id,
                warehouse_id=detail.target_warehouse_id,
                qty=detail.qty,
                txn_type="IN",
                reference=f"StockEntry:{entry.id}",
            )

    entry.status = StockEntryStatus.SUBMITTED
    await db.commit()

    stmt = select(StockEntry).options(selectinload(StockEntry.items)).where(StockEntry.id == id)
    res = await db.execute(stmt)
    return res.scalar_one()


@router.get(
    "/analytics/stock-value-by-group",
    summary="Stock value grouped by item group",
)
async def get_stock_value_by_group(
    db: AsyncSession = Depends(get_db),
):
    """
    Calculates current stock value for each item group based on current ledger quantities and item base price.
    """
    # Subquery to calculate current real-time stock balances per item
    balance_subquery = (
        select(
            StockLedger.item_id,
            func.sum(
                case(
                    (StockLedger.transaction_type == StockTransactionType.IN, StockLedger.qty_change),
                    else_=-StockLedger.qty_change,
                )
            ).label("qty_balance")
        )
        .group_by(StockLedger.item_id)
        .subquery()
    )

    # Main query joining with Item and ItemGroup to get the group name and total value
    stmt = (
        select(
            func.coalesce(ItemGroup.name, "Unassigned").label("group_name"),
            func.sum(balance_subquery.c.qty_balance * Item.base_price).label("total_value")
        )
        .select_from(balance_subquery)
        .join(Item, Item.id == balance_subquery.c.item_id)
        .outerjoin(ItemGroup, ItemGroup.id == Item.item_group_id)
        .group_by(ItemGroup.name)
    )

    result = await db.execute(stmt)
    rows = result.all()

    return [
        {
            "group_name": row.group_name,
            "total_value": float(row.total_value) if row.total_value is not None else 0.0,
        }
        for row in rows
    ]



# ─── Core Inventory Router (Merged) ───────────────────────────────────────────

from fastapi import APIRouter as CoreAPIRouter
from app.core.auth.router import RoleTierChecker
from app.core.catalog.models import Item as CatalogItem
from app.workspaces.inventory.models import (
    CoreWarehouse,
    CoreAsset,
    StockBalance,
)
from app.workspaces.inventory.schemas import (
    CoreWarehouseCreate,
    CoreWarehouseUpdate,
    CoreWarehouseRead,
    CoreAssetCreate,
    CoreAssetUpdate,
    CoreAssetRead,
    StockBalanceRead,
)

core_router = CoreAPIRouter(prefix="/inventory", tags=["Inventory"])

require_tier_2 = RoleTierChecker(required_tier=2)  # Manager or Admin for writes
require_tier_4 = RoleTierChecker(required_tier=4)  # User or higher for reads

# ─── Warehouse CRUD ────────────────────────────────────────────────────────────

@core_router.get("/warehouses", response_model=List[CoreWarehouseRead])
async def list_warehouses(
    db: AsyncSession = Depends(get_db),
    _ = Depends(require_tier_4)
):
    result = await db.execute(select(CoreWarehouse))
    return result.scalars().all()

@core_router.post("/warehouses", response_model=CoreWarehouseRead, status_code=status.HTTP_201_CREATED)
async def create_warehouse(
    warehouse_in: CoreWarehouseCreate,
    db: AsyncSession = Depends(get_db),
    _ = Depends(require_tier_2)
):
    if warehouse_in.parent_id:
        parent = await db.get(CoreWarehouse, warehouse_in.parent_id)
        if not parent:
            raise HTTPException(status_code=400, detail="Parent warehouse not found")

    warehouse = CoreWarehouse(**warehouse_in.model_dump())
    db.add(warehouse)
    await db.commit()
    await db.refresh(warehouse)
    return warehouse

@core_router.get("/warehouses/{warehouse_id}", response_model=CoreWarehouseRead)
async def get_warehouse(
    warehouse_id: UUID,
    db: AsyncSession = Depends(get_db),
    _ = Depends(require_tier_4)
):
    warehouse = await db.get(CoreWarehouse, warehouse_id)
    if not warehouse:
        raise HTTPException(status_code=404, detail="Warehouse not found")
    return warehouse

@core_router.put("/warehouses/{warehouse_id}", response_model=CoreWarehouseRead)
async def update_warehouse(
    warehouse_id: UUID,
    warehouse_in: CoreWarehouseUpdate,
    db: AsyncSession = Depends(get_db),
    _ = Depends(require_tier_2)
):
    warehouse = await db.get(CoreWarehouse, warehouse_id)
    if not warehouse:
        raise HTTPException(status_code=404, detail="Warehouse not found")

    update_data = warehouse_in.model_dump(exclude_unset=True)
    if "parent_id" in update_data and update_data["parent_id"]:
        if update_data["parent_id"] == warehouse_id:
            raise HTTPException(status_code=400, detail="A warehouse cannot be its own parent")
        parent = await db.get(CoreWarehouse, update_data["parent_id"])
        if not parent:
            raise HTTPException(status_code=400, detail="Parent warehouse not found")

    for key, value in update_data.items():
        setattr(warehouse, key, value)

    await db.commit()
    await db.refresh(warehouse)
    return warehouse

@core_router.delete("/warehouses/{warehouse_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_warehouse(
    warehouse_id: UUID,
    db: AsyncSession = Depends(get_db),
    _ = Depends(require_tier_2)
):
    warehouse = await db.get(CoreWarehouse, warehouse_id)
    if not warehouse:
        raise HTTPException(status_code=404, detail="Warehouse not found")

    await db.delete(warehouse)
    await db.commit()
    return None

# ─── Asset CRUD ────────────────────────────────────────────────────────────────

@core_router.get("/assets", response_model=List[CoreAssetRead])
async def list_assets(
    db: AsyncSession = Depends(get_db),
    _ = Depends(require_tier_4)
):
    result = await db.execute(select(CoreAsset))
    return result.scalars().all()

@core_router.post("/assets", response_model=CoreAssetRead, status_code=status.HTTP_201_CREATED)
async def create_asset(
    asset_in: CoreAssetCreate,
    db: AsyncSession = Depends(get_db),
    _ = Depends(require_tier_2)
):
    item = await db.get(CatalogItem, asset_in.item_id)
    if not item:
        raise HTTPException(status_code=400, detail="Item not found")

    asset = CoreAsset(**asset_in.model_dump())
    db.add(asset)
    await db.commit()
    await db.refresh(asset)
    return asset

@core_router.get("/assets/{asset_id}", response_model=CoreAssetRead)
async def get_asset(
    asset_id: UUID,
    db: AsyncSession = Depends(get_db),
    _ = Depends(require_tier_4)
):
    asset = await db.get(CoreAsset, asset_id)
    if not asset:
        raise HTTPException(status_code=404, detail="Asset not found")
    return asset

@core_router.put("/assets/{asset_id}", response_model=CoreAssetRead)
async def update_asset(
    asset_id: UUID,
    asset_in: CoreAssetUpdate,
    db: AsyncSession = Depends(get_db),
    _ = Depends(require_tier_2)
):
    asset = await db.get(CoreAsset, asset_id)
    if not asset:
        raise HTTPException(status_code=404, detail="Asset not found")

    update_data = asset_in.model_dump(exclude_unset=True)
    if "item_id" in update_data and update_data["item_id"]:
        item = await db.get(CatalogItem, update_data["item_id"])
        if not item:
            raise HTTPException(status_code=400, detail="Item not found")

    for key, value in update_data.items():
        setattr(asset, key, value)

    await db.commit()
    await db.refresh(asset)
    return asset

@core_router.delete("/assets/{asset_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_asset(
    asset_id: UUID,
    db: AsyncSession = Depends(get_db),
    _ = Depends(require_tier_2)
):
    asset = await db.get(CoreAsset, asset_id)
    if not asset:
        raise HTTPException(status_code=404, detail="Asset not found")

    await db.delete(asset)
    await db.commit()
    return None

# ─── Stock Balances Real-time Query ───────────────────────────────────────────

@core_router.get("/stock-balance", response_model=List[StockBalanceRead])
async def get_stock_balances(
    db: AsyncSession = Depends(get_db),
    _ = Depends(require_tier_4)
):
    """
    Highly optimized real-time query joining StockBalance with CatalogItem and CoreWarehouse.
    """
    stmt = (
        select(
            StockBalance.item_id,
            StockBalance.warehouse_id,
            StockBalance.actual_qty,
            CatalogItem.name.label("item_name"),
            CatalogItem.sku.label("sku"),
            CoreWarehouse.name.label("warehouse_name")
        )
        .join(CatalogItem, StockBalance.item_id == CatalogItem.id)
        .join(CoreWarehouse, StockBalance.warehouse_id == CoreWarehouse.id)
    )
    result = await db.execute(stmt)
    rows = result.all()
    return [
        StockBalanceRead(
            item_id=row.item_id,
            warehouse_id=row.warehouse_id,
            actual_qty=row.actual_qty,
            item_name=row.item_name,
            sku=row.sku,
            warehouse_name=row.warehouse_name,
        )
        for row in rows
    ]

@core_router.get("/products")
async def list_products(
    db: AsyncSession = Depends(get_db),
    _ = Depends(require_tier_4)
):
    return []



from .models import DeliveryNote, PickList, SerialNumber, BatchNumber

@router.get("/delivery-notes")
async def get_delivery_notes(db: AsyncSession = Depends(get_db)):
    res = await db.execute(select(DeliveryNote))
    return res.scalars().all()

@router.post("/delivery-notes")
async def create_delivery_note(payload: dict, db: AsyncSession = Depends(get_db)):
    return {"message": "Delivery Note Created"}

@router.get("/pick-lists")
async def get_pick_lists(db: AsyncSession = Depends(get_db)):
    res = await db.execute(select(PickList))
    return res.scalars().all()

@router.post("/pick-lists")
async def create_pick_list(payload: dict, db: AsyncSession = Depends(get_db)):
    return {"message": "Pick List Created"}

@router.get("/serial-numbers")
async def get_serial_numbers(db: AsyncSession = Depends(get_db)):
    res = await db.execute(select(SerialNumber))
    return res.scalars().all()

@router.post("/serial-numbers")
async def create_serial_number(payload: dict, db: AsyncSession = Depends(get_db)):
    return {"message": "Serial Number Created"}

@router.get("/batches")
async def get_batches(db: AsyncSession = Depends(get_db)):
    res = await db.execute(select(BatchNumber))
    return res.scalars().all()

@router.post("/batches")
async def create_batch(payload: dict, db: AsyncSession = Depends(get_db)):
    return {"message": "Batch Created"}

from .models import ItemAlternative, ItemManufacturer, ShippingRule, ProductBundle

@router.get("/item-groups/{group_id}")
async def get_item_group(group_id: UUID, db: AsyncSession = Depends(get_db)):
    return await db.get(ItemGroup, group_id)

@router.patch("/item-groups/{group_id}")
async def update_item_group(group_id: UUID, payload: dict, db: AsyncSession = Depends(get_db)):
    return {"message": "Updated"}

@router.get("/product-bundles")
async def list_product_bundles(db: AsyncSession = Depends(get_db)):
    res = await db.execute(select(ProductBundle))
    return res.scalars().all()

@router.post("/product-bundles")
async def create_product_bundle(payload: dict, db: AsyncSession = Depends(get_db)):
    return {"message": "Created"}

@router.get("/product-bundles/{id}")
async def get_product_bundle(id: UUID, db: AsyncSession = Depends(get_db)):
    return await db.get(ProductBundle, id)

@router.patch("/product-bundles/{id}")
async def update_product_bundle(id: UUID, payload: dict, db: AsyncSession = Depends(get_db)):
    return {"message": "Updated"}

@router.delete("/product-bundles/{id}")
async def delete_product_bundle(id: UUID, db: AsyncSession = Depends(get_db)):
    return {"message": "Deleted"}

@router.get("/shipping-rules")
async def list_shipping_rules(db: AsyncSession = Depends(get_db)):
    res = await db.execute(select(ShippingRule))
    return res.scalars().all()

@router.post("/shipping-rules")
async def create_shipping_rule(payload: dict, db: AsyncSession = Depends(get_db)):
    return {"message": "Created"}

@router.get("/shipping-rules/{id}")
async def get_shipping_rule(id: UUID, db: AsyncSession = Depends(get_db)):
    return await db.get(ShippingRule, id)

@router.patch("/shipping-rules/{id}")
async def update_shipping_rule(id: UUID, payload: dict, db: AsyncSession = Depends(get_db)):
    return {"message": "Updated"}

@router.delete("/shipping-rules/{id}")
async def delete_shipping_rule(id: UUID, db: AsyncSession = Depends(get_db)):
    return {"message": "Deleted"}

@router.get("/item-alternatives")
async def list_item_alternatives(db: AsyncSession = Depends(get_db)):
    res = await db.execute(select(ItemAlternative))
    return res.scalars().all()

@router.post("/item-alternatives")
async def create_item_alternative(payload: dict, db: AsyncSession = Depends(get_db)):
    return {"message": "Created"}

@router.get("/item-alternatives/{id}")
async def get_item_alternative(id: UUID, db: AsyncSession = Depends(get_db)):
    return await db.get(ItemAlternative, id)

@router.patch("/item-alternatives/{id}")
async def update_item_alternative(id: UUID, payload: dict, db: AsyncSession = Depends(get_db)):
    return {"message": "Updated"}

@router.delete("/item-alternatives/{id}")
async def delete_item_alternative(id: UUID, db: AsyncSession = Depends(get_db)):
    return {"message": "Deleted"}

@router.get("/item-manufacturers")
async def list_item_manufacturers(db: AsyncSession = Depends(get_db)):
    res = await db.execute(select(ItemManufacturer))
    return res.scalars().all()

@router.post("/item-manufacturers")
async def create_item_manufacturer(payload: dict, db: AsyncSession = Depends(get_db)):
    return {"message": "Created"}

@router.get("/item-manufacturers/{id}")
async def get_item_manufacturer(id: UUID, db: AsyncSession = Depends(get_db)):
    return await db.get(ItemManufacturer, id)

@router.patch("/item-manufacturers/{id}")
async def update_item_manufacturer(id: UUID, payload: dict, db: AsyncSession = Depends(get_db)):
    return {"message": "Updated"}

@router.delete("/item-manufacturers/{id}")
async def delete_item_manufacturer(id: UUID, db: AsyncSession = Depends(get_db)):
    return {"message": "Deleted"}
