"""
Inventory Workspace — SQLAlchemy Models
========================================
Tables are prefixed with `inv_` to ensure clean namespace isolation from
core models (e.g., the `items` table already exists in app.core.catalog).

All models inherit from CoreModel which provides:
  - UUID primary key
  - JSONB custom_attributes column (GIN-indexed)
"""

import enum
import uuid
from datetime import datetime, timezone
from decimal import Decimal

from sqlalchemy import (
    Boolean,
    DateTime,
    Enum as SAEnum,
    ForeignKey,
    Index,
    Numeric,
    String,
    Text,
    UUID as SQLUUID,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import CoreModel


# ─── Transaction Type Enum ────────────────────────────────────────────────────

class StockTransactionType(str, enum.Enum):
    IN  = "IN"   # Goods received / stock increase
    OUT = "OUT"  # Goods dispatched / stock decrease


# ─── Item ─────────────────────────────────────────────────────────────────────

class InventoryItem(CoreModel):
    """
    Master item catalog for the Inventory workspace.
    Decoupled from app.core.catalog models intentionally — the workspace
    maintains its own enriched item registry (price, UOM, grouping, status).
    """
    __tablename__ = "inv_items"

    sku: Mapped[str] = mapped_column(
        String(100), unique=True, index=True, nullable=False
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    base_price: Mapped[Decimal] = mapped_column(
        Numeric(precision=18, scale=4), nullable=False, default=Decimal("0.0000")
    )
    uom: Mapped[str] = mapped_column(
        String(50), nullable=False, default="Piece",
        comment="Unit of measure — e.g. Piece, Box, Kg, Litre"
    )
    item_group: Mapped[str] = mapped_column(
        String(100), nullable=False, default="General",
        comment="Logical grouping — e.g. Raw Material, Finished Goods"
    )
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)

    # Relationships
    stock_ledger_entries: Mapped[list["StockLedger"]] = relationship(
        "StockLedger", back_populates="item", cascade="all, delete-orphan"
    )

    __table_args__ = (
        Index("idx_inv_items_custom_attributes", "custom_attributes", postgresql_using="gin"),
    )


# Item alias
Item = InventoryItem


# ─── Warehouse ────────────────────────────────────────────────────────────────

class Warehouse(CoreModel):
    """Physical or virtual storage location."""
    __tablename__ = "inv_warehouses"

    name: Mapped[str] = mapped_column(String(255), nullable=False, unique=True, index=True)
    location_address: Mapped[str | None] = mapped_column(Text, nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)

    # Relationships
    stock_ledger_entries: Mapped[list["StockLedger"]] = relationship(
        "StockLedger", back_populates="warehouse", cascade="all, delete-orphan"
    )

    __table_args__ = (
        Index("idx_inv_warehouses_custom_attributes", "custom_attributes", postgresql_using="gin"),
    )


# ─── StockLedger ─────────────────────────────────────────────────────────────

class StockLedger(CoreModel):
    """
    Immutable ledger recording every stock movement.
    Each row is an IN or OUT transaction against a specific
    item + warehouse pair. Quantity on hand is derived by summing entries.
    """
    __tablename__ = "inv_stock_ledger"

    item_id: Mapped[uuid.UUID] = mapped_column(
        SQLUUID(as_uuid=True),
        ForeignKey("inv_items.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    warehouse_id: Mapped[uuid.UUID] = mapped_column(
        SQLUUID(as_uuid=True),
        ForeignKey("inv_warehouses.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    qty_change: Mapped[Decimal] = mapped_column(
        Numeric(precision=18, scale=4), nullable=False,
        comment="Positive number — direction is determined by transaction_type"
    )
    transaction_type: Mapped[StockTransactionType] = mapped_column(
        SAEnum(StockTransactionType, name="inv_stock_transaction_type", create_type=True),
        nullable=False,
    )
    reference_note: Mapped[str | None] = mapped_column(
        String(500), nullable=True,
        comment="Optional PO/SO number, batch ID, or free-text note"
    )
    timestamp: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
        index=True,
    )

    # Relationships
    item: Mapped["InventoryItem"] = relationship("InventoryItem", back_populates="stock_ledger_entries")
    warehouse: Mapped["Warehouse"] = relationship("Warehouse", back_populates="stock_ledger_entries")

    __table_args__ = (
        Index("idx_inv_stock_ledger_custom_attributes", "custom_attributes", postgresql_using="gin"),
    )
