"""
Procurement Workspace — Pydantic Schemas
=========================================
Strict Create / Read / Update separation matching the ERPNext Buying workflow.
"""

import uuid
from datetime import datetime
from decimal import Decimal
from typing import Any, List, Optional

from pydantic import BaseModel, Field

from app.workspaces.procurement.models import (
    DocumentStatus,
    InvoiceStatus,
    MaterialRequestStatus,
    PurchaseOrderStatus,
)

# Backward-compatible alias (used by existing code)
PurchaseReceiptStatus = DocumentStatus


# ─── Supplier ─────────────────────────────────────────────────────────────────

class SupplierBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=255, description="Legal or trading name of the supplier")
    group: Optional[str] = Field(default=None, max_length=100, description="Supplier classification group")
    tax_id: Optional[str] = Field(default=None, max_length=100, description="VAT / GST / EIN number")
    custom_attributes: dict[str, Any] = Field(default_factory=dict)


class SupplierCreate(SupplierBase):
    pass


class SupplierUpdate(BaseModel):
    name: Optional[str] = Field(default=None, min_length=1, max_length=255)
    group: Optional[str] = Field(default=None, max_length=100)
    tax_id: Optional[str] = Field(default=None, max_length=100)
    is_active: Optional[bool] = None
    custom_attributes: Optional[dict[str, Any]] = None


class SupplierRead(SupplierBase):
    id: uuid.UUID
    is_active: bool
    model_config = {"from_attributes": True}


# ─── Material Request ─────────────────────────────────────────────────────────

class MaterialRequestItemBase(BaseModel):
    item_id: uuid.UUID = Field(..., description="UUID of the InventoryItem being requested")
    qty: Decimal = Field(..., gt=Decimal("0"), decimal_places=4)
    warehouse_id: Optional[uuid.UUID] = Field(default=None, description="Preferred destination warehouse")
    custom_attributes: dict[str, Any] = Field(default_factory=dict)


class MaterialRequestItemCreate(MaterialRequestItemBase):
    pass


class MaterialRequestItemRead(MaterialRequestItemBase):
    id: uuid.UUID
    request_id: uuid.UUID
    model_config = {"from_attributes": True}


class MaterialRequestBase(BaseModel):
    request_date: datetime = Field(..., description="Date the request was raised")
    required_by: Optional[datetime] = Field(default=None, description="Deadline date for fulfilment")
    custom_attributes: dict[str, Any] = Field(default_factory=dict)


class MaterialRequestCreate(MaterialRequestBase):
    items: List[MaterialRequestItemCreate] = Field(..., min_length=1)


class MaterialRequestUpdate(BaseModel):
    required_by: Optional[datetime] = None
    status: Optional[MaterialRequestStatus] = None
    custom_attributes: Optional[dict[str, Any]] = None


class MaterialRequestRead(MaterialRequestBase):
    id: uuid.UUID
    status: MaterialRequestStatus
    items: List[MaterialRequestItemRead] = []
    model_config = {"from_attributes": True}


# ─── Purchase Order ───────────────────────────────────────────────────────────

class PurchaseOrderItemBase(BaseModel):
    item_id: uuid.UUID = Field(..., description="UUID of the InventoryItem ordered")
    qty: Decimal = Field(..., gt=Decimal("0"), decimal_places=4)
    rate: Decimal = Field(..., ge=Decimal("0"), decimal_places=4, description="Negotiated unit price")
    warehouse_id: Optional[uuid.UUID] = Field(default=None, description="Target receiving warehouse")
    custom_attributes: dict[str, Any] = Field(default_factory=dict)


class PurchaseOrderItemCreate(PurchaseOrderItemBase):
    pass


class PurchaseOrderItemRead(PurchaseOrderItemBase):
    id: uuid.UUID
    order_id: uuid.UUID
    model_config = {"from_attributes": True}


class PurchaseOrderBase(BaseModel):
    supplier_id: uuid.UUID = Field(..., description="UUID of the Supplier")
    order_date: datetime = Field(..., description="Date the order was placed")
    total_amount: Decimal = Field(default=Decimal("0.0000"), ge=Decimal("0"), decimal_places=4)
    material_request_id: Optional[uuid.UUID] = Field(default=None, description="Originating MaterialRequest")
    custom_attributes: dict[str, Any] = Field(default_factory=dict)


class PurchaseOrderCreate(PurchaseOrderBase):
    items: List[PurchaseOrderItemCreate] = Field(..., min_length=1)


class PurchaseOrderUpdate(BaseModel):
    order_date: Optional[datetime] = None
    total_amount: Optional[Decimal] = Field(default=None, ge=Decimal("0"), decimal_places=4)
    status: Optional[PurchaseOrderStatus] = None
    custom_attributes: Optional[dict[str, Any]] = None


class PurchaseOrderRead(PurchaseOrderBase):
    id: uuid.UUID
    status: PurchaseOrderStatus
    items: List[PurchaseOrderItemRead] = []
    model_config = {"from_attributes": True}


# ─── Purchase Receipt ─────────────────────────────────────────────────────────

class PurchaseReceiptItemBase(BaseModel):
    item_id: uuid.UUID = Field(..., description="UUID of the InventoryItem received")
    warehouse_id: uuid.UUID = Field(..., description="UUID of the destination Warehouse")
    accepted_qty: Decimal = Field(..., gt=Decimal("0"), decimal_places=4)
    rate: Decimal = Field(..., ge=Decimal("0"), decimal_places=4)
    purchase_order_item_id: Optional[uuid.UUID] = Field(
        default=None, description="Link to the originating PO line item"
    )
    custom_attributes: dict[str, Any] = Field(default_factory=dict)


class PurchaseReceiptItemCreate(PurchaseReceiptItemBase):
    pass


class PurchaseReceiptItemRead(PurchaseReceiptItemBase):
    id: uuid.UUID
    receipt_id: uuid.UUID
    model_config = {"from_attributes": True}


class PurchaseReceiptBase(BaseModel):
    supplier_id: uuid.UUID = Field(..., description="UUID of the Supplier")
    receipt_date: datetime = Field(..., description="Date goods were physically received")
    purchase_order_id: Optional[uuid.UUID] = Field(
        default=None, description="Originating Purchase Order (optional)"
    )
    custom_attributes: dict[str, Any] = Field(default_factory=dict)


class PurchaseReceiptCreate(PurchaseReceiptBase):
    items: List[PurchaseReceiptItemCreate] = Field(..., min_length=1)


class PurchaseReceiptRead(PurchaseReceiptBase):
    id: uuid.UUID
    status: DocumentStatus
    items: List[PurchaseReceiptItemRead] = []
    model_config = {"from_attributes": True}


# ─── Purchase Invoice ─────────────────────────────────────────────────────────

class PurchaseInvoiceBase(BaseModel):
    supplier_id: uuid.UUID = Field(..., description="UUID of the Supplier")
    purchase_receipt_id: Optional[uuid.UUID] = Field(
        default=None, description="GRN this invoice is raised against"
    )
    invoice_date: datetime = Field(..., description="Date on the supplier's invoice")
    due_date: Optional[datetime] = Field(default=None, description="Payment due date")
    amount: Decimal = Field(..., ge=Decimal("0"), decimal_places=4, description="Net invoice amount before tax")
    tax_amount: Decimal = Field(default=Decimal("0.0000"), ge=Decimal("0"), decimal_places=4)
    custom_attributes: dict[str, Any] = Field(default_factory=dict)


class PurchaseInvoiceCreate(PurchaseInvoiceBase):
    pass


class PurchaseInvoiceUpdate(BaseModel):
    due_date: Optional[datetime] = None
    amount: Optional[Decimal] = Field(default=None, ge=Decimal("0"), decimal_places=4)
    tax_amount: Optional[Decimal] = Field(default=None, ge=Decimal("0"), decimal_places=4)
    status: Optional[InvoiceStatus] = None
    custom_attributes: Optional[dict[str, Any]] = None


class PurchaseInvoiceRead(PurchaseInvoiceBase):
    id: uuid.UUID
    status: InvoiceStatus
    model_config = {"from_attributes": True}
