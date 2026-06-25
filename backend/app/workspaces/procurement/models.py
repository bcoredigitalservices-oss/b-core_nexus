"""
Procurement Workspace — SQLAlchemy Models
==========================================
Implements the full ERPNext Buying workflow:

  Supplier → MaterialRequest → PurchaseOrder → PurchaseReceipt → PurchaseInvoice

All tables use the `proc_` prefix for clean namespace isolation.
CoreModel provides: UUID PK, JSONB custom_attributes (GIN-indexed).
"""

import enum
import uuid
from datetime import datetime
from decimal import Decimal

from sqlalchemy import Boolean, DateTime, ForeignKey, Numeric, String
from sqlalchemy import Enum as SAEnum
from sqlalchemy.dialects.postgresql import UUID as SQLUUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import CoreModel


# ─── Enumerations ─────────────────────────────────────────────────────────────

class DocumentStatus(str, enum.Enum):
    Draft     = "Draft"
    Submitted = "Submitted"
    Cancelled = "Cancelled"

class PurchaseOrderStatus(str, enum.Enum):
    Draft     = "Draft"
    Submitted = "Submitted"
    Received  = "Received"
    Cancelled = "Cancelled"

class MaterialRequestStatus(str, enum.Enum):
    Draft     = "Draft"
    Submitted = "Submitted"
    Ordered   = "Ordered"
    Received  = "Received"
    Cancelled = "Cancelled"

class InvoiceStatus(str, enum.Enum):
    Draft     = "Draft"
    Submitted = "Submitted"
    Paid      = "Paid"
    Cancelled = "Cancelled"

# Keep backward-compatible alias used by router / schemas
PurchaseReceiptStatus = DocumentStatus


# ─── Supplier ─────────────────────────────────────────────────────────────────

class Supplier(CoreModel):
    """
    Master record for a vendor / supplier entity.
    All purchase documents reference this table as the authoritative source.
    """
    __tablename__ = "proc_suppliers"

    name: Mapped[str] = mapped_column(String(255), nullable=False, unique=True, index=True)
    group: Mapped[str | None] = mapped_column(
        String(100), nullable=True,
        comment="Supplier classification group, e.g. 'Raw Material', 'Services'"
    )
    tax_id: Mapped[str | None] = mapped_column(
        String(100), nullable=True, index=True,
        comment="VAT / GST / EIN registration number"
    )
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)

    # Relationships (back-references populated by child models)
    purchase_orders: Mapped[list["PurchaseOrder"]] = relationship(
        "PurchaseOrder", back_populates="supplier", cascade="all, delete-orphan"
    )
    purchase_invoices: Mapped[list["PurchaseInvoice"]] = relationship(
        "PurchaseInvoice", back_populates="supplier", cascade="all, delete-orphan"
    )


# ─── Material Request ─────────────────────────────────────────────────────────

class MaterialRequest(CoreModel):
    """
    Internal demand document raised before a Purchase Order is created.
    Tracks what items are needed, by when, and their current fulfilment status.
    """
    __tablename__ = "proc_material_requests"

    request_date: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False,
        comment="Date the request was raised"
    )
    required_by: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True,
        comment="Date the material must be available"
    )
    status: Mapped[MaterialRequestStatus] = mapped_column(
        SAEnum(MaterialRequestStatus, name="proc_material_request_status", create_type=True),
        nullable=False, default=MaterialRequestStatus.Draft
    )

    # Relationships
    items: Mapped[list["MaterialRequestItem"]] = relationship(
        "MaterialRequestItem", back_populates="request", cascade="all, delete-orphan"
    )


class MaterialRequestItem(CoreModel):
    """Line item within a MaterialRequest."""
    __tablename__ = "proc_material_request_items"

    request_id: Mapped[uuid.UUID] = mapped_column(
        SQLUUID(as_uuid=True),
        ForeignKey("proc_material_requests.id", ondelete="CASCADE"),
        nullable=False, index=True,
    )
    item_id: Mapped[uuid.UUID] = mapped_column(
        SQLUUID(as_uuid=True),
        ForeignKey("inv_items.id", ondelete="CASCADE"),
        nullable=False, index=True,
    )
    qty: Mapped[Decimal] = mapped_column(Numeric(precision=18, scale=4), nullable=False)
    warehouse_id: Mapped[uuid.UUID | None] = mapped_column(
        SQLUUID(as_uuid=True),
        ForeignKey("inv_warehouses.id", ondelete="SET NULL"),
        nullable=True, index=True,
    )

    # Relationships
    request: Mapped["MaterialRequest"] = relationship("MaterialRequest", back_populates="items")
    item: Mapped["InventoryItem"] = relationship("InventoryItem")
    warehouse: Mapped["Warehouse | None"] = relationship("Warehouse")


# ─── Purchase Order ───────────────────────────────────────────────────────────

class PurchaseOrder(CoreModel):
    """
    Formal order placed with a Supplier after a MaterialRequest is approved.
    Tracks the total committed amount and links to the fulfilling receipt.
    """
    __tablename__ = "proc_purchase_orders"

    supplier_id: Mapped[uuid.UUID] = mapped_column(
        SQLUUID(as_uuid=True),
        ForeignKey("proc_suppliers.id", ondelete="RESTRICT"),
        nullable=False, index=True,
    )
    order_date: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    total_amount: Mapped[Decimal] = mapped_column(
        Numeric(precision=18, scale=4), nullable=False, default=Decimal("0.0000")
    )
    status: Mapped[PurchaseOrderStatus] = mapped_column(
        SAEnum(PurchaseOrderStatus, name="proc_purchase_order_status", create_type=True),
        nullable=False, default=PurchaseOrderStatus.Draft,
    )
    material_request_id: Mapped[uuid.UUID | None] = mapped_column(
        SQLUUID(as_uuid=True),
        ForeignKey("proc_material_requests.id", ondelete="SET NULL"),
        nullable=True, index=True,
        comment="Optional reference back to the originating MaterialRequest"
    )

    # Relationships
    supplier: Mapped["Supplier"] = relationship("Supplier", back_populates="purchase_orders")
    material_request: Mapped["MaterialRequest | None"] = relationship("MaterialRequest")
    items: Mapped[list["PurchaseOrderItem"]] = relationship(
        "PurchaseOrderItem", back_populates="order", cascade="all, delete-orphan"
    )
    receipts: Mapped[list["PurchaseReceipt"]] = relationship(
        "PurchaseReceipt", back_populates="purchase_order"
    )


class PurchaseOrderItem(CoreModel):
    """Line item within a PurchaseOrder."""
    __tablename__ = "proc_purchase_order_items"

    order_id: Mapped[uuid.UUID] = mapped_column(
        SQLUUID(as_uuid=True),
        ForeignKey("proc_purchase_orders.id", ondelete="CASCADE"),
        nullable=False, index=True,
    )
    item_id: Mapped[uuid.UUID] = mapped_column(
        SQLUUID(as_uuid=True),
        ForeignKey("inv_items.id", ondelete="CASCADE"),
        nullable=False, index=True,
    )
    qty: Mapped[Decimal] = mapped_column(Numeric(precision=18, scale=4), nullable=False)
    rate: Mapped[Decimal] = mapped_column(Numeric(precision=18, scale=4), nullable=False)
    warehouse_id: Mapped[uuid.UUID | None] = mapped_column(
        SQLUUID(as_uuid=True),
        ForeignKey("inv_warehouses.id", ondelete="SET NULL"),
        nullable=True, index=True,
    )

    # Relationships
    order: Mapped["PurchaseOrder"] = relationship("PurchaseOrder", back_populates="items")
    item: Mapped["InventoryItem"] = relationship("InventoryItem")
    warehouse: Mapped["Warehouse | None"] = relationship("Warehouse")


# ─── Purchase Receipt ─────────────────────────────────────────────────────────

class PurchaseReceipt(CoreModel):
    """
    Goods Receipt Note (GRN) — records physical delivery from a Supplier.
    Links to a PurchaseOrder and drives stock movements on submission.
    """
    __tablename__ = "proc_purchase_receipts"

    supplier_id: Mapped[uuid.UUID] = mapped_column(
        SQLUUID(as_uuid=True),
        ForeignKey("proc_suppliers.id", ondelete="RESTRICT"),
        nullable=False, index=True,
    )
    purchase_order_id: Mapped[uuid.UUID | None] = mapped_column(
        SQLUUID(as_uuid=True),
        ForeignKey("proc_purchase_orders.id", ondelete="SET NULL"),
        nullable=True, index=True,
        comment="Optional link to the originating Purchase Order"
    )
    receipt_date: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    status: Mapped[DocumentStatus] = mapped_column(
        SAEnum(DocumentStatus, name="proc_purchase_receipt_status", create_type=True),
        nullable=False, default=DocumentStatus.Draft,
    )

    # Relationships
    supplier: Mapped["Supplier"] = relationship("Supplier")
    purchase_order: Mapped["PurchaseOrder | None"] = relationship(
        "PurchaseOrder", back_populates="receipts"
    )
    items: Mapped[list["PurchaseReceiptItem"]] = relationship(
        "PurchaseReceiptItem",
        back_populates="receipt",
        cascade="all, delete-orphan",
    )


class PurchaseReceiptItem(CoreModel):
    """Line item within a PurchaseReceipt, recording accepted quantities and rates."""
    __tablename__ = "proc_purchase_receipt_items"

    receipt_id: Mapped[uuid.UUID] = mapped_column(
        SQLUUID(as_uuid=True),
        ForeignKey("proc_purchase_receipts.id", ondelete="CASCADE"),
        nullable=False, index=True,
    )
    item_id: Mapped[uuid.UUID] = mapped_column(
        SQLUUID(as_uuid=True),
        ForeignKey("inv_items.id", ondelete="CASCADE"),
        nullable=False, index=True,
    )
    warehouse_id: Mapped[uuid.UUID] = mapped_column(
        SQLUUID(as_uuid=True),
        ForeignKey("inv_warehouses.id", ondelete="RESTRICT"),
        nullable=False, index=True,
    )
    accepted_qty: Mapped[Decimal] = mapped_column(Numeric(precision=18, scale=4), nullable=False)
    rate: Mapped[Decimal] = mapped_column(Numeric(precision=18, scale=4), nullable=False)
    purchase_order_item_id: Mapped[uuid.UUID | None] = mapped_column(
        SQLUUID(as_uuid=True),
        ForeignKey("proc_purchase_order_items.id", ondelete="SET NULL"),
        nullable=True, index=True,
        comment="Link to the originating PO line for over/under-receipt tracking"
    )

    # Relationships
    receipt: Mapped["PurchaseReceipt"] = relationship("PurchaseReceipt", back_populates="items")
    item: Mapped["InventoryItem"] = relationship("InventoryItem")
    warehouse: Mapped["Warehouse"] = relationship("Warehouse")
    purchase_order_item: Mapped["PurchaseOrderItem | None"] = relationship("PurchaseOrderItem")


# ─── Purchase Invoice ─────────────────────────────────────────────────────────

class PurchaseInvoice(CoreModel):
    """
    Supplier bill / Purchase Invoice — issued against a PurchaseReceipt.
    Drives Accounts Payable entries once submitted.
    """
    __tablename__ = "proc_purchase_invoices"

    supplier_id: Mapped[uuid.UUID] = mapped_column(
        SQLUUID(as_uuid=True),
        ForeignKey("proc_suppliers.id", ondelete="RESTRICT"),
        nullable=False, index=True,
    )
    purchase_receipt_id: Mapped[uuid.UUID | None] = mapped_column(
        SQLUUID(as_uuid=True),
        ForeignKey("proc_purchase_receipts.id", ondelete="SET NULL"),
        nullable=True, index=True,
        comment="GRN this invoice is raised against"
    )
    invoice_date: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    due_date: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    amount: Mapped[Decimal] = mapped_column(
        Numeric(precision=18, scale=4), nullable=False, default=Decimal("0.0000")
    )
    tax_amount: Mapped[Decimal] = mapped_column(
        Numeric(precision=18, scale=4), nullable=False, default=Decimal("0.0000")
    )
    status: Mapped[InvoiceStatus] = mapped_column(
        SAEnum(InvoiceStatus, name="proc_invoice_status", create_type=True),
        nullable=False, default=InvoiceStatus.Draft,
    )

    # Relationships
    supplier: Mapped["Supplier"] = relationship("Supplier", back_populates="purchase_invoices")
    purchase_receipt: Mapped["PurchaseReceipt | None"] = relationship("PurchaseReceipt")
