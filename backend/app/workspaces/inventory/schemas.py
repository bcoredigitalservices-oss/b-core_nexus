"""
Inventory Workspace — Pydantic Schemas
========================================
Strict validation schemas for the Inventory workspace API layer.
Follows the Create / Read separation pattern used across B-Core Nexus.
"""

from datetime import date, datetime, time
from decimal import Decimal
from typing import Any, Dict, Optional
from uuid import UUID

from pydantic import BaseModel, Field, field_validator

from app.workspaces.inventory.models import (
    AssetStatus,
    StockTransactionType,
    StockEntryType,
    StockEntryStatus,
)


# ─── Item Group ───────────────────────────────────────────────────────────────

class ItemGroupBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=100, description="Unique item category name")
    parent_id: Optional[UUID] = Field(default=None, description="UUID of the parent category if nested")
    custom_attributes: dict[str, Any] = Field(default_factory=dict)

class ItemGroupCreate(ItemGroupBase):
    pass

class ItemGroupUpdate(BaseModel):
    name: Optional[str] = Field(default=None, min_length=1, max_length=100)
    parent_id: Optional[UUID] = None
    custom_attributes: Optional[dict[str, Any]] = None

class ItemGroupResponse(ItemGroupBase):
    id: UUID
    model_config = {"from_attributes": True}


# ─── Inventory Settings ───────────────────────────────────────────────────────

class InventorySettingsBase(BaseModel):
    default_uom: str = Field(..., min_length=1, max_length=50, description="Global system default UOM")
    custom_attributes: dict[str, Any] = Field(default_factory=dict)

class InventorySettingsUpdate(BaseModel):
    default_uom: str = Field(..., min_length=1, max_length=50)

class InventorySettingsResponse(InventorySettingsBase):
    id: UUID
    model_config = {"from_attributes": True}


# ─── InventoryItem ─────────────────────────────────────────────────────────────

class InventoryItemBase(BaseModel):
    sku: str = Field(
        ...,
        min_length=1,
        max_length=100,
        description="Globally unique stock-keeping unit code",
        examples=["SKU-FG-001"],
    )
    name: str = Field(..., min_length=1, max_length=255, description="Human-readable item name")
    description: Optional[str] = Field(default=None, max_length=2000)
    base_price: Decimal = Field(
        default=Decimal("0.0000"),
        ge=Decimal("0"),
        decimal_places=4,
        description="Base selling/procurement price in the system's base currency",
    )
    uom: str = Field(
        default="Piece",
        max_length=50,
        description="Unit of measure — e.g. Piece, Box, Kg, Litre",
    )
    item_group_id: Optional[UUID] = Field(
        default=None,
        description="Logical grouping referencing inv_item_groups",
    )
    custom_attributes: dict[str, Any] = Field(default_factory=dict)

    @field_validator("sku")
    @classmethod
    def normalise_sku(cls, v: str) -> str:
        stripped = v.strip().upper()
        if not stripped:
            raise ValueError("SKU cannot be blank after stripping whitespace.")
        return stripped

    @field_validator("uom")
    @classmethod
    def validate_uom(cls, v: str) -> str:
        return v.strip()


class ItemCreate(InventoryItemBase):
    """Payload accepted by POST /items."""
    pass


class ItemUpdate(BaseModel):
    """All fields are optional for PATCH-style updates."""
    name: Optional[str] = Field(default=None, min_length=1, max_length=255)
    description: Optional[str] = Field(default=None, max_length=2000)
    base_price: Optional[Decimal] = Field(default=None, ge=Decimal("0"), decimal_places=4)
    uom: Optional[str] = Field(default=None, max_length=50)
    item_group_id: Optional[UUID] = None
    is_active: Optional[bool] = None
    custom_attributes: Optional[dict[str, Any]] = None


class ItemResponse(BaseModel):
    """Response schema — includes server-generated fields."""
    id: UUID
    sku: str
    name: str
    description: Optional[str] = None
    base_price: Decimal
    uom: str
    item_group_id: Optional[UUID] = None
    item_group_name: Optional[str] = None
    is_active: bool
    custom_attributes: dict[str, Any]

    model_config = {"from_attributes": True}

    @classmethod
    def model_validate(cls, obj: Any, *args, **kwargs):
        res = super().model_validate(obj, *args, **kwargs)
        if hasattr(obj, "item_group") and obj.item_group:
            res.item_group_name = obj.item_group.name
        return res


# Compatibility aliases
InventoryItemCreate = ItemCreate
InventoryItemUpdate = ItemUpdate
InventoryItemRead = ItemResponse


# ─── Warehouse ────────────────────────────────────────────────────────────────

class WarehouseBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=255, description="Unique warehouse / storage location name")
    location_address: str = Field(..., min_length=1, description="Physical address or GPS coordinates")
    custom_attributes: Dict[str, Any] = Field(default_factory=dict)


class WarehouseCreate(WarehouseBase):
    pass


class WarehouseUpdate(BaseModel):
    name: Optional[str] = Field(default=None, min_length=1, max_length=255)
    location_address: Optional[str] = None
    is_active: Optional[bool] = None
    custom_attributes: Optional[Dict[str, Any]] = None


class WarehouseResponse(WarehouseBase):
    id: UUID
    is_active: bool

    model_config = {"from_attributes": True}


# Compatibility alias
WarehouseRead = WarehouseResponse


# ─── StockLedger ─────────────────────────────────────────────────────────────

class StockLedgerBase(BaseModel):
    item_id: UUID = Field(..., description="UUID of the InventoryItem to transact against")
    warehouse_id: UUID = Field(..., description="UUID of the target Warehouse")
    qty_change: Decimal = Field(
        ...,
        gt=Decimal("0"),
        decimal_places=4,
        description="Quantity moved. Must be positive — direction is set by transaction_type.",
    )
    transaction_type: StockTransactionType = Field(
        ..., description="IN = stock received, OUT = stock dispatched"
    )
    reference_note: Optional[str] = Field(
        default=None,
        max_length=500,
        description="Optional PO/SO number, batch ID, or free-text note",
    )
    batch_id: Optional[UUID] = Field(default=None, description="Optional UUID reference to the BatchNumber")
    serial_id: Optional[UUID] = Field(default=None, description="Optional UUID reference to the SerialNumber")
    custom_attributes: Dict[str, Any] = Field(default_factory=dict)


class StockLedgerCreate(StockLedgerBase):
    pass


class StockLedgerRead(StockLedgerBase):
    id: UUID
    timestamp: datetime

    model_config = {"from_attributes": True}


# ─── Paginated list wrapper ───────────────────────────────────────────────────

class PaginatedItemsResponse(BaseModel):
    total: int
    limit: int
    offset: int
    items: list[ItemResponse]


# ─── Stock Adjustment ──────────────────────────────────────────────────────────

import enum

class AdjustmentTransactionType(str, enum.Enum):
    IN = "IN"
    OUT = "OUT"
    TRANSFER = "TRANSFER"


class StockAdjustmentPayload(BaseModel):
    item_id: UUID = Field(..., description="UUID of the InventoryItem to adjust")
    warehouse_id: UUID = Field(..., description="UUID of the target Warehouse (or destination warehouse for TRANSFER)")
    qty_change: Decimal = Field(..., gt=Decimal("0"), decimal_places=4, description="Always positive quantity of movement")
    transaction_type: AdjustmentTransactionType = Field(..., description="IN, OUT, or TRANSFER")
    source_warehouse_id: Optional[UUID] = Field(default=None, description="Required only when transaction_type is TRANSFER")
    reference_note: Optional[str] = Field(default=None, max_length=500, description="Optional explanation or reference")
    custom_attributes: Dict[str, Any] = Field(default_factory=dict)


# ─── Assets & Custody Tracking ────────────────────────────────────────────────

# Redundant import removed

class AssetBase(BaseModel):
    asset_name: str = Field(..., min_length=1, max_length=255, description="Name of the asset")
    item_id: UUID = Field(..., description="UUID of the catalog InventoryItem")
    purchase_date: datetime = Field(..., description="Date/time the asset was purchased")
    gross_purchase_amount: Decimal = Field(default=Decimal("0.0000"), ge=Decimal("0"), decimal_places=4, description="Cost of the purchase")
    location_id: Optional[UUID] = Field(default=None, description="Current or initial warehouse location")
    custom_attributes: dict[str, Any] = Field(default_factory=dict)

class AssetCreate(AssetBase):
    pass

class AssetUpdate(BaseModel):
    asset_name: Optional[str] = Field(default=None, min_length=1, max_length=255)
    item_id: Optional[UUID] = None
    purchase_date: Optional[datetime] = None
    gross_purchase_amount: Optional[Decimal] = Field(default=None, ge=Decimal("0"), decimal_places=4)
    status: Optional[AssetStatus] = None
    location_id: Optional[UUID] = None
    allocated_to_user_id: Optional[UUID] = None
    custom_attributes: Optional[dict[str, Any]] = None

class AssetResponse(BaseModel):
    id: UUID
    asset_name: str
    item_id: UUID
    item_name: Optional[str] = None
    purchase_date: datetime
    gross_purchase_amount: Decimal
    status: AssetStatus
    allocated_to_user_id: Optional[UUID] = None
    allocated_to_user_email: Optional[str] = None
    location_id: Optional[UUID] = None
    location_name: Optional[str] = None
    custom_attributes: dict[str, Any]

    model_config = {"from_attributes": True}

    @classmethod
    def model_validate(cls, obj: Any, *args, **kwargs):
        res = super().model_validate(obj, *args, **kwargs)
        if hasattr(obj, "item") and obj.item:
            res.item_name = obj.item.name
        if hasattr(obj, "allocated_to_user") and obj.allocated_to_user:
            res.allocated_to_user_email = obj.allocated_to_user.email
        if hasattr(obj, "location") and obj.location:
            res.location_name = obj.location.name
        return res

class AssetAllocationPayload(BaseModel):
    allocated_to_user_id: UUID = Field(..., description="UUID of the User to allocate the asset to")
    location_id: Optional[UUID] = Field(default=None, description="Optional warehouse location for the asset during allocation")

class AssetAllocationHistoryResponse(BaseModel):
    id: UUID
    asset_id: UUID
    allocated_to_user_id: UUID
    allocated_to_user_email: Optional[str] = None
    allocated_at: datetime
    returned_at: Optional[datetime] = None
    location_id: Optional[UUID] = None
    location_name: Optional[str] = None
    custom_attributes: dict[str, Any]

    model_config = {"from_attributes": True}

    @classmethod
    def model_validate(cls, obj: Any, *args, **kwargs):
        res = super().model_validate(obj, *args, **kwargs)
        if hasattr(obj, "allocated_to_user") and obj.allocated_to_user:
            res.allocated_to_user_email = obj.allocated_to_user.email
        if hasattr(obj, "location") and obj.location:
            res.location_name = obj.location.name
        return res


# ─── Core Inventory Schemas (Merged) ──────────────────────────────────────────

class CoreWarehouseBase(BaseModel):
    name: str
    is_group: bool = False
    parent_id: Optional[UUID] = None
    custom_attributes: dict[str, Any] = {}

class CoreWarehouseCreate(CoreWarehouseBase):
    pass

class CoreWarehouseUpdate(BaseModel):
    name: Optional[str] = None
    is_group: Optional[bool] = None
    parent_id: Optional[UUID] = None
    custom_attributes: Optional[dict[str, Any]] = None

class CoreWarehouseRead(CoreWarehouseBase):
    id: UUID
    model_config = {"from_attributes": True}

class CoreAssetBase(BaseModel):
    asset_name: str
    item_id: UUID
    purchase_date: datetime
    gross_purchase_amount: Decimal
    status: str = "Draft"  # 'Draft', 'In Use', 'Scrapped'
    custom_attributes: dict[str, Any] = {}

class CoreAssetCreate(CoreAssetBase):
    pass

class CoreAssetUpdate(BaseModel):
    asset_name: Optional[str] = None
    item_id: Optional[UUID] = None
    purchase_date: Optional[datetime] = None
    gross_purchase_amount: Optional[Decimal] = None
    status: Optional[str] = None
    custom_attributes: Optional[dict[str, Any]] = None

class CoreAssetRead(CoreAssetBase):
    id: UUID
    model_config = {"from_attributes": True}

class StockBalanceRead(BaseModel):
    item_id: UUID
    warehouse_id: UUID
    actual_qty: Decimal
    item_name: str
    sku: str
    warehouse_name: str
    model_config = {"from_attributes": True}


# ─── Product Bundle ──────────────────────────────────────────────────────────

class ProductBundleItemBase(BaseModel):
    item_id: UUID = Field(..., description="UUID of the child InventoryItem")
    qty: Decimal = Field(..., gt=Decimal("0"), decimal_places=4, description="Quantity of the item in the bundle")

class ProductBundleItemCreate(ProductBundleItemBase):
    pass

class ProductBundleItemResponse(ProductBundleItemBase):
    id: UUID
    model_config = {"from_attributes": True}

class ProductBundleBase(BaseModel):
    parent_item_id: UUID = Field(..., description="UUID of the parent InventoryItem")
    custom_attributes: dict[str, Any] = Field(default_factory=dict)

class ProductBundleCreate(ProductBundleBase):
    items: list[ProductBundleItemCreate] = Field(..., description="List of child items in the bundle")

class ProductBundleResponse(ProductBundleBase):
    id: UUID
    sku: Optional[str] = None
    name: Optional[str] = None
    category: Optional[str] = None
    status: Optional[str] = None
    items: list[ProductBundleItemResponse]
    model_config = {"from_attributes": True}

    @classmethod
    def model_validate(cls, obj: Any, *args, **kwargs):
        res = super().model_validate(obj, *args, **kwargs)
        if hasattr(obj, "parent_item") and obj.parent_item:
            res.sku = obj.parent_item.sku
            res.name = obj.parent_item.name
            if getattr(obj.parent_item, "item_group", None):
                res.category = obj.parent_item.item_group.name
            else:
                res.category = "Unassigned"
            res.status = "Active" if obj.parent_item.is_active else "Inactive"
        return res


# ─── Batch Number ─────────────────────────────────────────────────────────────

class BatchNumberBase(BaseModel):
    batch_id: str = Field(..., min_length=1, max_length=100, description="Unique batch code/ID")
    expiry_date: Optional[datetime] = Field(default=None, description="Batch expiration date")
    item_id: UUID = Field(..., description="UUID of the InventoryItem this batch belongs to")
    custom_attributes: dict[str, Any] = Field(default_factory=dict)

class BatchNumberCreate(BatchNumberBase):
    pass

class BatchNumberUpdate(BaseModel):
    batch_id: Optional[str] = Field(default=None, min_length=1, max_length=100)
    expiry_date: Optional[datetime] = None
    item_id: Optional[UUID] = None
    custom_attributes: Optional[dict[str, Any]] = None

class BatchNumberResponse(BatchNumberBase):
    id: UUID
    model_config = {"from_attributes": True}


# ─── Serial Number ────────────────────────────────────────────────────────────

class SerialNumberBase(BaseModel):
    serial_no: str = Field(..., min_length=1, max_length=100, description="Unique serial number")
    status: str = Field(default="Active", max_length=50, description="Current status of the serial number")
    item_id: UUID = Field(..., description="UUID of the associated InventoryItem")
    warehouse_id: Optional[UUID] = Field(default=None, description="UUID of the Warehouse where item is located")
    purchase_document_type: Optional[str] = Field(default=None, max_length=100, description="Type of the purchase document")
    custom_attributes: dict[str, Any] = Field(default_factory=dict)

class SerialNumberCreate(SerialNumberBase):
    pass

class SerialNumberUpdate(BaseModel):
    serial_no: Optional[str] = Field(default=None, min_length=1, max_length=100)
    status: Optional[str] = Field(default=None, max_length=50)
    item_id: Optional[UUID] = None
    warehouse_id: Optional[UUID] = None
    purchase_document_type: Optional[str] = Field(default=None, max_length=100)
    custom_attributes: Optional[dict[str, Any]] = None

class SerialNumberResponse(SerialNumberBase):
    id: UUID
    model_config = {"from_attributes": True}


# ─── Stock Operations ──────────────────────────────────────────────────────────

class StockEntryDetailBase(BaseModel):
    source_warehouse_id: Optional[UUID] = Field(default=None, description="Source Warehouse UUID")
    target_warehouse_id: Optional[UUID] = Field(default=None, description="Target Warehouse UUID")
    item_id: UUID = Field(..., description="InventoryItem UUID")
    qty: Decimal = Field(..., description="Quantity moved/received")
    basic_rate: Decimal = Field(default=Decimal("0.0000"), description="Basic rate/valuation rate of the item")
    custom_attributes: dict[str, Any] = Field(default_factory=dict)


class StockEntryDetailCreate(StockEntryDetailBase):
    pass


class StockEntryDetailUpdate(BaseModel):
    source_warehouse_id: Optional[UUID] = None
    target_warehouse_id: Optional[UUID] = None
    item_id: Optional[UUID] = None
    qty: Optional[Decimal] = None
    basic_rate: Optional[Decimal] = None
    custom_attributes: Optional[dict[str, Any]] = None


class StockEntryDetailResponse(StockEntryDetailBase):
    id: UUID
    stock_entry_id: UUID
    model_config = {"from_attributes": True}


class StockEntryBase(BaseModel):
    series: str = Field(..., description="Series identifier")
    entry_type: StockEntryType = Field(..., description="Type of stock entry")
    posting_date: date = Field(..., description="Date of posting")
    posting_time: time = Field(..., description="Time of posting")
    default_warehouse_id: Optional[UUID] = Field(default=None, description="Default Warehouse UUID")
    status: StockEntryStatus = Field(default=StockEntryStatus.DRAFT, description="Current entry status")
    custom_attributes: dict[str, Any] = Field(default_factory=dict)


class StockEntryCreate(StockEntryBase):
    items: list[StockEntryDetailCreate] = Field(..., description="Line items/details for the stock entry")


class StockEntryUpdate(BaseModel):
    series: Optional[str] = None
    entry_type: Optional[StockEntryType] = None
    posting_date: Optional[date] = None
    posting_time: Optional[time] = None
    default_warehouse_id: Optional[UUID] = None
    status: Optional[StockEntryStatus] = None
    custom_attributes: Optional[dict[str, Any]] = None
    items: Optional[list[StockEntryDetailCreate]] = None


class StockEntryResponse(StockEntryBase):
    id: UUID
    items: list[StockEntryDetailResponse]
    model_config = {"from_attributes": True}


# Compatibility Aliases
StockEntryRead = StockEntryResponse
StockEntryDetailRead = StockEntryDetailResponse


# ─── Catalog Enrichment Master Data ──────────────────────────────────────────

class ItemAlternativeBase(BaseModel):
    item_id: UUID = Field(..., description="Primary InventoryItem UUID")
    alternative_item_id: UUID = Field(..., description="Alternative InventoryItem UUID")
    custom_attributes: dict[str, Any] = Field(default_factory=dict)


class ItemAlternativeCreate(ItemAlternativeBase):
    pass


class ItemAlternativeUpdate(BaseModel):
    item_id: Optional[UUID] = None
    alternative_item_id: Optional[UUID] = None
    custom_attributes: Optional[dict[str, Any]] = None


class ItemAlternativeResponse(ItemAlternativeBase):
    id: UUID
    model_config = {"from_attributes": True}


class ItemManufacturerBase(BaseModel):
    item_id: UUID = Field(..., description="InventoryItem UUID")
    manufacturer_name: str = Field(..., description="Name of the manufacturer")
    manufacturer_part_no: str = Field(..., description="Manufacturer part number")
    custom_attributes: dict[str, Any] = Field(default_factory=dict)


class ItemManufacturerCreate(ItemManufacturerBase):
    pass


class ItemManufacturerUpdate(BaseModel):
    item_id: Optional[UUID] = None
    manufacturer_name: Optional[str] = None
    manufacturer_part_no: Optional[str] = None
    custom_attributes: Optional[dict[str, Any]] = None


class ItemManufacturerResponse(ItemManufacturerBase):
    id: UUID
    model_config = {"from_attributes": True}


class ShippingRuleBase(BaseModel):
    name: str = Field(..., description="Unique shipping rule name")
    status: str = Field(default="Active", description="Current status of the shipping rule")
    custom_attributes: dict[str, Any] = Field(default_factory=dict)


class ShippingRuleCreate(ShippingRuleBase):
    pass


class ShippingRuleUpdate(BaseModel):
    name: Optional[str] = None
    status: Optional[str] = None
    custom_attributes: Optional[dict[str, Any]] = None


class ShippingRuleResponse(ShippingRuleBase):
    id: UUID
    model_config = {"from_attributes": True}


# Compatibility Aliases
ItemAlternativeRead = ItemAlternativeResponse
ItemManufacturerRead = ItemManufacturerResponse
ShippingRuleRead = ShippingRuleResponse



