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
from datetime import date, datetime, time, timezone
from decimal import Decimal

from sqlalchemy import (
    Boolean,
    Date,
    DateTime,
    Enum as SAEnum,
    ForeignKey,
    Index,
    Numeric,
    String,
    Text,
    Time,
    UUID as SQLUUID,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import CoreModel


# ─── Transaction Type Enum ────────────────────────────────────────────────────

class StockTransactionType(str, enum.Enum):
    IN  = "IN"   # Goods received / stock increase
    OUT = "OUT"  # Goods dispatched / stock decrease


# ─── Item Group (Hierarchy) ───────────────────────────────────────────────────

class ItemGroup(CoreModel):
    """
    Hierarchical item group classification (Adjacency List model).
    Allows nesting item categories infinitely (e.g. Raw Materials -> Packaging -> Box).
    """
    __tablename__ = "inv_item_groups"

    name: Mapped[str] = mapped_column(String(100), unique=True, index=True, nullable=False)
    parent_id: Mapped[uuid.UUID | None] = mapped_column(
        SQLUUID(as_uuid=True),
        ForeignKey("inv_item_groups.id", ondelete="CASCADE"),
        nullable=True
    )

    parent: Mapped["ItemGroup | None"] = relationship(
        "app.workspaces.inventory.models.ItemGroup",
        remote_side="app.workspaces.inventory.models.ItemGroup.id",
        backref="children"
    )


# ─── Inventory Settings ───────────────────────────────────────────────────────

class InventorySettings(CoreModel):
    """
    Global warehouse / stock preferences, including company-wide default UOM.
    Stores setup config values.
    """
    __tablename__ = "inv_settings"

    default_uom: Mapped[str] = mapped_column(String(50), nullable=False, default="Piece")


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
    item_group_id: Mapped[uuid.UUID | None] = mapped_column(
        SQLUUID(as_uuid=True),
        ForeignKey("inv_item_groups.id", ondelete="SET NULL"),
        nullable=True
    )
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)

    # Relationships
    item_group: Mapped["ItemGroup | None"] = relationship("app.workspaces.inventory.models.ItemGroup")
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

    batch_id: Mapped[uuid.UUID | None] = mapped_column(
        SQLUUID(as_uuid=True),
        ForeignKey("inv_batch_numbers.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    serial_id: Mapped[uuid.UUID | None] = mapped_column(
        SQLUUID(as_uuid=True),
        ForeignKey("inv_serial_numbers.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )

    batch: Mapped["BatchNumber | None"] = relationship("BatchNumber")
    serial_number: Mapped["SerialNumber | None"] = relationship("SerialNumber")

    __table_args__ = (
        Index("idx_inv_stock_ledger_custom_attributes", "custom_attributes", postgresql_using="gin"),
    )


# ─── Asset & Asset Allocation History ──────────────────────────────────────────

class AssetStatus(str, enum.Enum):
    Available = "Available"
    Allocated = "Allocated"
    Maintenance = "Maintenance"


class Asset(CoreModel):
    """
    Physical or digital resource/asset owned by the organization and tracked in B-Core.
    Prefix with inv_assets to avoid namespace conflict with app.core.inventory.models.Asset.
    """
    __tablename__ = "inv_assets"

    asset_name: Mapped[str] = mapped_column(String(255), nullable=False)
    item_id: Mapped[uuid.UUID] = mapped_column(
        SQLUUID(as_uuid=True),
        ForeignKey("inv_items.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    purchase_date: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    gross_purchase_amount: Mapped[Decimal] = mapped_column(
        Numeric(precision=18, scale=4), nullable=False, default=Decimal("0.0000")
    )
    status: Mapped[AssetStatus] = mapped_column(
        SAEnum(AssetStatus, name="inv_asset_status", create_type=True),
        nullable=False,
        default=AssetStatus.Available,
        index=True
    )
    allocated_to_user_id: Mapped[uuid.UUID | None] = mapped_column(
        SQLUUID(as_uuid=True),
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
        index=True
    )
    location_id: Mapped[uuid.UUID | None] = mapped_column(
        SQLUUID(as_uuid=True),
        ForeignKey("inv_warehouses.id", ondelete="SET NULL"),
        nullable=True,
        index=True
    )

    # Relationships
    item: Mapped["InventoryItem"] = relationship("InventoryItem")
    allocated_to_user: Mapped["User | None"] = relationship("User", foreign_keys=[allocated_to_user_id])
    location: Mapped["Warehouse | None"] = relationship("Warehouse", foreign_keys=[location_id])

    __table_args__ = (
        Index("idx_inv_assets_custom_attributes", "custom_attributes", postgresql_using="gin"),
    )


class AssetAllocationHistory(CoreModel):
    """
    Audit log / custody trail tracking who possessed an asset and when.
    """
    __tablename__ = "inv_asset_allocation_history"

    asset_id: Mapped[uuid.UUID] = mapped_column(
        SQLUUID(as_uuid=True),
        ForeignKey("inv_assets.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    allocated_to_user_id: Mapped[uuid.UUID] = mapped_column(
        SQLUUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    allocated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
        index=True
    )
    returned_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
        index=True
    )
    location_id: Mapped[uuid.UUID | None] = mapped_column(
        SQLUUID(as_uuid=True),
        ForeignKey("inv_warehouses.id", ondelete="SET NULL"),
        nullable=True,
        index=True
    )

    # Relationships
    asset: Mapped["Asset"] = relationship("Asset")
    allocated_to_user: Mapped["User"] = relationship("User", foreign_keys=[allocated_to_user_id])
    location: Mapped["Warehouse | None"] = relationship("Warehouse", foreign_keys=[location_id])

    __table_args__ = (
        Index("idx_inv_asset_allocation_history_custom_attributes", "custom_attributes", postgresql_using="gin"),
    )


# ─── Product Bundle & Tracking Models ─────────────────────────────────────────

class ProductBundle(CoreModel):
    """
    Groups a parent InventoryItem with multiple child items for retail bundling.
    Each parent item can only have one bundle definition.
    """
    __tablename__ = "inv_product_bundles"

    parent_item_id: Mapped[uuid.UUID] = mapped_column(
        SQLUUID(as_uuid=True),
        ForeignKey("inv_items.id", ondelete="CASCADE"),
        nullable=False,
        unique=True,
        index=True,
    )

    # Relationships
    parent_item: Mapped["InventoryItem"] = relationship("InventoryItem", foreign_keys=[parent_item_id])
    items: Mapped[list["ProductBundleItem"]] = relationship(
        "ProductBundleItem",
        back_populates="bundle",
        cascade="all, delete-orphan",
    )

    __table_args__ = (
        Index("idx_inv_product_bundles_custom_attributes", "custom_attributes", postgresql_using="gin"),
    )


class ProductBundleItem(CoreModel):
    """
    Child item reference within a ProductBundle mapping.
    """
    __tablename__ = "inv_product_bundle_items"

    bundle_id: Mapped[uuid.UUID] = mapped_column(
        SQLUUID(as_uuid=True),
        ForeignKey("inv_product_bundles.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    item_id: Mapped[uuid.UUID] = mapped_column(
        SQLUUID(as_uuid=True),
        ForeignKey("inv_items.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    qty: Mapped[Decimal] = mapped_column(
        Numeric(precision=18, scale=4),
        nullable=False,
    )

    # Relationships
    bundle: Mapped["ProductBundle"] = relationship("ProductBundle", back_populates="items")
    item: Mapped["InventoryItem"] = relationship("InventoryItem", foreign_keys=[item_id])

    __table_args__ = (
        Index("idx_inv_product_bundle_items_custom_attributes", "custom_attributes", postgresql_using="gin"),
    )


class BatchNumber(CoreModel):
    """
    Tracks inventory item batches and their expiry dates.
    """
    __tablename__ = "inv_batch_numbers"

    batch_id: Mapped[str] = mapped_column(
        String(100),
        unique=True,
        index=True,
        nullable=False,
    )
    expiry_date: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )
    item_id: Mapped[uuid.UUID] = mapped_column(
        SQLUUID(as_uuid=True),
        ForeignKey("inv_items.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    # Relationships
    item: Mapped["InventoryItem"] = relationship("InventoryItem")

    __table_args__ = (
        Index("idx_inv_batch_numbers_custom_attributes", "custom_attributes", postgresql_using="gin"),
    )


class SerialNumber(CoreModel):
    """
    Tracks precise serial numbers for individual inventory items.
    """
    __tablename__ = "inv_serial_numbers"

    serial_no: Mapped[str] = mapped_column(
        String(100),
        unique=True,
        index=True,
        nullable=False,
    )
    status: Mapped[str] = mapped_column(
        String(50),
        default="Active",
        nullable=False,
    )
    item_id: Mapped[uuid.UUID] = mapped_column(
        SQLUUID(as_uuid=True),
        ForeignKey("inv_items.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    warehouse_id: Mapped[uuid.UUID | None] = mapped_column(
        SQLUUID(as_uuid=True),
        ForeignKey("inv_warehouses.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    purchase_document_type: Mapped[str | None] = mapped_column(
        String(100),
        nullable=True,
    )

    # Relationships
    item: Mapped["InventoryItem"] = relationship("InventoryItem")
    warehouse: Mapped["Warehouse | None"] = relationship("Warehouse", foreign_keys=[warehouse_id])

    __table_args__ = (
        Index("idx_inv_serial_numbers_custom_attributes", "custom_attributes", postgresql_using="gin"),
    )


# ─── Core Inventory Models (Merged) ──────────────────────────────────────────

class CoreWarehouse(CoreModel):
    __tablename__ = "warehouses"

    name: Mapped[str] = mapped_column(String, nullable=False)
    is_group: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    parent_id: Mapped[uuid.UUID | None] = mapped_column(SQLUUID(as_uuid=True), ForeignKey("warehouses.id"), nullable=True)

    # Optional relationships to self for parent-child
    parent: Mapped["CoreWarehouse | None"] = relationship(
        "CoreWarehouse",
        remote_side="CoreWarehouse.id",
        backref="children",
    )

class CoreAsset(CoreModel):
    __tablename__ = "assets"

    asset_name: Mapped[str] = mapped_column(String, nullable=False)
    item_id: Mapped[uuid.UUID] = mapped_column(SQLUUID(as_uuid=True), ForeignKey("items.id"), nullable=False)
    purchase_date: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    gross_purchase_amount: Mapped[Decimal] = mapped_column(Numeric(precision=18, scale=6), nullable=False)
    status: Mapped[str] = mapped_column(String, default="Draft", nullable=False)  # 'Draft', 'In Use', 'Scrapped'

    # Relationship to catalog Item
    item = relationship("Item")

class StockLedgerEntry(CoreModel):
    __tablename__ = "stock_ledger_entries"

    item_id: Mapped[uuid.UUID] = mapped_column(SQLUUID(as_uuid=True), ForeignKey("items.id"), nullable=False)
    warehouse_id: Mapped[uuid.UUID] = mapped_column(SQLUUID(as_uuid=True), ForeignKey("warehouses.id"), nullable=False)
    voucher_type: Mapped[str] = mapped_column(String, nullable=False)  # e.g., 'Purchase Receipt'
    voucher_id: Mapped[uuid.UUID] = mapped_column(SQLUUID(as_uuid=True), nullable=False)
    qty_change: Mapped[Decimal] = mapped_column(Numeric(precision=18, scale=6), nullable=False)

    # Relationships
    item = relationship("Item")
    warehouse = relationship("CoreWarehouse")

class StockBalance(CoreModel):
    __tablename__ = "stock_balances"

    id = None  # Do not use default surrogate UUID primary key from CoreModel
    item_id: Mapped[uuid.UUID] = mapped_column(SQLUUID(as_uuid=True), ForeignKey("items.id"), primary_key=True)
    warehouse_id: Mapped[uuid.UUID] = mapped_column(SQLUUID(as_uuid=True), ForeignKey("warehouses.id"), primary_key=True)
    actual_qty: Mapped[Decimal] = mapped_column(Numeric(precision=18, scale=6), default=Decimal('0'), nullable=False)

    # Relationships
    item = relationship("Item")
    warehouse = relationship("CoreWarehouse")


# ─── Stock Operations ──────────────────────────────────────────────────────────

class StockEntryType(str, enum.Enum):
    MATERIAL_RECEIPT = "Material Receipt"
    MATERIAL_ISSUE = "Material Issue"
    MATERIAL_TRANSFER = "Material Transfer"
    MANUFACTURE = "Manufacture"


class StockEntryStatus(str, enum.Enum):
    DRAFT = "Draft"
    SUBMITTED = "Submitted"


class StockEntry(CoreModel):
    """StockEntry model tracks stock transaction movements like receipt, issue, transfer, or manufacture."""
    __tablename__ = "inv_stock_entries"

    series: Mapped[str] = mapped_column(String(100), nullable=False)
    entry_type: Mapped[StockEntryType] = mapped_column(
        SAEnum(StockEntryType, name="inv_stock_entry_type", create_type=True),
        nullable=False,
    )
    posting_date: Mapped[date] = mapped_column(Date, nullable=False)
    posting_time: Mapped[time] = mapped_column(Time, nullable=False)
    default_warehouse_id: Mapped[uuid.UUID | None] = mapped_column(
        SQLUUID(as_uuid=True),
        ForeignKey("inv_warehouses.id", ondelete="SET NULL"),
        nullable=True,
    )
    status: Mapped[StockEntryStatus] = mapped_column(
        SAEnum(StockEntryStatus, name="inv_stock_entry_status", create_type=True),
        nullable=False,
        default=StockEntryStatus.DRAFT,
    )

    # Relationships
    default_warehouse: Mapped["Warehouse | None"] = relationship("Warehouse")
    items: Mapped[list["StockEntryDetail"]] = relationship(
        "StockEntryDetail",
        back_populates="stock_entry",
        cascade="all, delete-orphan",
    )


class StockEntryDetail(CoreModel):
    """Individual line items within a StockEntry."""
    __tablename__ = "inv_stock_entry_details"

    stock_entry_id: Mapped[uuid.UUID] = mapped_column(
        SQLUUID(as_uuid=True),
        ForeignKey("inv_stock_entries.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    source_warehouse_id: Mapped[uuid.UUID | None] = mapped_column(
        SQLUUID(as_uuid=True),
        ForeignKey("inv_warehouses.id", ondelete="SET NULL"),
        nullable=True,
    )
    target_warehouse_id: Mapped[uuid.UUID | None] = mapped_column(
        SQLUUID(as_uuid=True),
        ForeignKey("inv_warehouses.id", ondelete="SET NULL"),
        nullable=True,
    )
    item_id: Mapped[uuid.UUID] = mapped_column(
        SQLUUID(as_uuid=True),
        ForeignKey("inv_items.id", ondelete="CASCADE"),
        nullable=False,
    )
    qty: Mapped[Decimal] = mapped_column(
        Numeric(precision=18, scale=4),
        nullable=False,
    )
    basic_rate: Mapped[Decimal] = mapped_column(
        Numeric(precision=18, scale=4),
        nullable=False,
        default=Decimal("0.0000"),
    )

    # Relationships
    stock_entry: Mapped["StockEntry"] = relationship("StockEntry", back_populates="items")
    item: Mapped["InventoryItem"] = relationship("InventoryItem")
    source_warehouse: Mapped["Warehouse | None"] = relationship("Warehouse", foreign_keys=[source_warehouse_id])
    target_warehouse: Mapped["Warehouse | None"] = relationship("Warehouse", foreign_keys=[target_warehouse_id])


# ─── Catalog Enrichment Master Data ──────────────────────────────────────────

class ItemAlternative(CoreModel):
    """Enriches catalog items by defining alternative choices."""
    __tablename__ = "inv_item_alternatives"

    item_id: Mapped[uuid.UUID] = mapped_column(
        SQLUUID(as_uuid=True),
        ForeignKey("inv_items.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    alternative_item_id: Mapped[uuid.UUID] = mapped_column(
        SQLUUID(as_uuid=True),
        ForeignKey("inv_items.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    # Relationships
    item: Mapped["InventoryItem"] = relationship("InventoryItem", foreign_keys=[item_id])
    alternative_item: Mapped["InventoryItem"] = relationship("InventoryItem", foreign_keys=[alternative_item_id])


class ItemManufacturer(CoreModel):
    """Enriches catalog items with manufacturer specific part details."""
    __tablename__ = "inv_item_manufacturers"

    item_id: Mapped[uuid.UUID] = mapped_column(
        SQLUUID(as_uuid=True),
        ForeignKey("inv_items.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    manufacturer_name: Mapped[str] = mapped_column(String(255), nullable=False)
    manufacturer_part_no: Mapped[str] = mapped_column(String(100), nullable=False)

    # Relationships
    item: Mapped["InventoryItem"] = relationship("InventoryItem")


class ShippingRule(CoreModel):
    """Defines shipping rules that can be associated with items or locations."""
    __tablename__ = "inv_shipping_rules"

    name: Mapped[str] = mapped_column(String(255), nullable=False, unique=True, index=True)
    status: Mapped[str] = mapped_column(String(50), nullable=False, default="Active")




class DeliveryNote(CoreModel):
    __tablename__ = "inv_delivery_notes"

    series: Mapped[str] = mapped_column(String(100), nullable=False)
    customer_name: Mapped[str] = mapped_column(String(255), nullable=False)
    posting_date: Mapped[date] = mapped_column(Date, nullable=False)
    posting_time: Mapped[time] = mapped_column(Time, nullable=False)
    status: Mapped[str] = mapped_column(String(50), nullable=False, default="Draft")

class DeliveryNoteDetail(CoreModel):
    __tablename__ = "inv_delivery_note_details"

    delivery_note_id: Mapped[uuid.UUID] = mapped_column(
        SQLUUID(as_uuid=True), ForeignKey("inv_delivery_notes.id", ondelete="CASCADE"), nullable=False
    )
    item_id: Mapped[uuid.UUID] = mapped_column(SQLUUID(as_uuid=True), nullable=False)
    warehouse_id: Mapped[uuid.UUID] = mapped_column(SQLUUID(as_uuid=True), nullable=False)
    qty: Mapped[float] = mapped_column(Numeric(18, 4), nullable=False)
    uom: Mapped[str] = mapped_column(String(50), nullable=False)
    rate: Mapped[float] = mapped_column(Numeric(18, 4), nullable=False)
    amount: Mapped[float] = mapped_column(Numeric(18, 4), nullable=False)

class PickList(CoreModel):
    __tablename__ = "inv_pick_lists"

    company: Mapped[str] = mapped_column(String(255), nullable=False)
    purpose: Mapped[str] = mapped_column(String(255), nullable=False)
    status: Mapped[str] = mapped_column(String(50), nullable=False, default="Draft")

class PickListItem(CoreModel):
    __tablename__ = "inv_pick_list_items"

    pick_list_id: Mapped[uuid.UUID] = mapped_column(
        SQLUUID(as_uuid=True), ForeignKey("inv_pick_lists.id", ondelete="CASCADE"), nullable=False
    )
    item_id: Mapped[uuid.UUID] = mapped_column(SQLUUID(as_uuid=True), nullable=False)
    warehouse_id: Mapped[uuid.UUID] = mapped_column(SQLUUID(as_uuid=True), nullable=False)
    qty: Mapped[float] = mapped_column(Numeric(18, 4), nullable=False)
    picked_qty: Mapped[float] = mapped_column(Numeric(18, 4), nullable=False, default=0.0)
