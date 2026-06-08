"""
Inventory Workspace — Pydantic Schemas
========================================
Strict validation schemas for the Inventory workspace API layer.
Follows the Create / Read separation pattern used across B-Core Nexus.
"""

from datetime import datetime
from decimal import Decimal
from typing import Any, Dict, Optional
from uuid import UUID

from pydantic import BaseModel, Field, field_validator

from app.workspaces.inventory.models import StockTransactionType


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
    item_group: str = Field(
        default="General",
        max_length=100,
        description="Logical grouping — e.g. Raw Material, Finished Goods",
    )
    custom_attributes: Dict[str, Any] = Field(default_factory=dict)

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
    item_group: Optional[str] = Field(default=None, max_length=100)
    is_active: Optional[bool] = None
    custom_attributes: Optional[Dict[str, Any]] = None


class ItemResponse(InventoryItemBase):
    """Response schema — includes server-generated fields."""
    id: UUID
    is_active: bool

    model_config = {"from_attributes": True}


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
