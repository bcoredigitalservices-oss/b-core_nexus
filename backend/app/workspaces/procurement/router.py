"""
Procurement Workspace — Router
================================
Implements the full ERPNext Buying workflow:

  Supplier → MaterialRequest → PurchaseOrder → PurchaseReceipt → PurchaseInvoice

All routes require the 'procurement' workspace membership.
Write operations (POST/PATCH/DELETE) require Tier 2 (Manager/Admin).
Read operations (GET) require Tier 4 (standard User).
"""

from typing import List, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.auth.router import RoleTierChecker
from app.core.dependencies.auth import require_workspace_access
from app.database import get_db
from app.workspaces.inventory.models import InventoryItem, Warehouse
from app.workspaces.procurement.models import (
    DocumentStatus,
    InvoiceStatus,
    MaterialRequest,
    MaterialRequestItem,
    MaterialRequestStatus,
    PurchaseInvoice,
    PurchaseOrder,
    PurchaseOrderItem,
    PurchaseOrderStatus,
    PurchaseReceipt,
    PurchaseReceiptItem,
    Supplier,
)
from app.workspaces.procurement.schemas import (
    MaterialRequestCreate,
    MaterialRequestRead,
    MaterialRequestUpdate,
    PurchaseInvoiceCreate,
    PurchaseInvoiceRead,
    PurchaseInvoiceUpdate,
    PurchaseOrderCreate,
    PurchaseOrderRead,
    PurchaseOrderUpdate,
    PurchaseReceiptCreate,
    PurchaseReceiptRead,
    SupplierCreate,
    SupplierRead,
    SupplierUpdate,
)

router = APIRouter(
    prefix="/procurement",
    tags=["Procurement"],
    dependencies=[Depends(require_workspace_access("procurement"))],
)

require_tier_2 = RoleTierChecker(required_tier=2)  # Manager / Admin — write access
require_tier_4 = RoleTierChecker(required_tier=4)  # Standard User — read access


# ══════════════════════════════════════════════════════════════════════════════
# Suppliers
# ══════════════════════════════════════════════════════════════════════════════

@router.get("/suppliers", response_model=List[SupplierRead], summary="List all suppliers")
async def list_suppliers(
    is_active: Optional[bool] = Query(default=None),
    db: AsyncSession = Depends(get_db),
    _ = Depends(require_tier_4),
):
    stmt = select(Supplier).order_by(Supplier.name)
    if is_active is not None:
        stmt = stmt.where(Supplier.is_active == is_active)
    result = await db.execute(stmt)
    return result.scalars().all()


@router.get("/suppliers/{supplier_id}", response_model=SupplierRead, summary="Get a supplier by ID")
async def get_supplier(
    supplier_id: UUID,
    db: AsyncSession = Depends(get_db),
    _ = Depends(require_tier_4),
):
    supplier = await db.get(Supplier, supplier_id)
    if not supplier:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Supplier not found.")
    return supplier


@router.post(
    "/suppliers",
    response_model=SupplierRead,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new supplier",
)
async def create_supplier(
    payload: SupplierCreate,
    db: AsyncSession = Depends(get_db),
    _ = Depends(require_tier_2),
):
    # Guard unique name
    existing = await db.execute(select(Supplier).where(Supplier.name == payload.name))
    if existing.scalars().first():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"A supplier named '{payload.name}' already exists.",
        )
    supplier = Supplier(**payload.model_dump())
    db.add(supplier)
    await db.commit()
    await db.refresh(supplier)
    return supplier


@router.patch("/suppliers/{supplier_id}", response_model=SupplierRead, summary="Update a supplier")
async def update_supplier(
    supplier_id: UUID,
    payload: SupplierUpdate,
    db: AsyncSession = Depends(get_db),
    _ = Depends(require_tier_2),
):
    supplier = await db.get(Supplier, supplier_id)
    if not supplier:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Supplier not found.")

    if payload.name and payload.name != supplier.name:
        existing = await db.execute(select(Supplier).where(Supplier.name == payload.name))
        if existing.scalars().first():
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"A supplier named '{payload.name}' already exists.",
            )

    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(supplier, field, value)

    await db.commit()
    await db.refresh(supplier)
    return supplier


@router.delete(
    "/suppliers/{supplier_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Deactivate (soft-delete) a supplier",
)
async def delete_supplier(
    supplier_id: UUID,
    db: AsyncSession = Depends(get_db),
    _ = Depends(require_tier_2),
):
    supplier = await db.get(Supplier, supplier_id)
    if not supplier:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Supplier not found.")
    supplier.is_active = False
    await db.commit()
    return None


# ══════════════════════════════════════════════════════════════════════════════
# Material Requests
# ══════════════════════════════════════════════════════════════════════════════

@router.get(
    "/material-requests",
    response_model=List[MaterialRequestRead],
    summary="List all material requests",
)
async def list_material_requests(
    status_filter: Optional[MaterialRequestStatus] = Query(default=None, alias="status"),
    db: AsyncSession = Depends(get_db),
    _ = Depends(require_tier_4),
):
    stmt = (
        select(MaterialRequest)
        .options(selectinload(MaterialRequest.items))
        .order_by(MaterialRequest.request_date.desc())
    )
    if status_filter:
        stmt = stmt.where(MaterialRequest.status == status_filter)
    result = await db.execute(stmt)
    return result.scalars().all()


@router.get(
    "/material-requests/{mr_id}",
    response_model=MaterialRequestRead,
    summary="Get a material request by ID",
)
async def get_material_request(
    mr_id: UUID,
    db: AsyncSession = Depends(get_db),
    _ = Depends(require_tier_4),
):
    stmt = (
        select(MaterialRequest)
        .options(selectinload(MaterialRequest.items))
        .where(MaterialRequest.id == mr_id)
    )
    result = await db.execute(stmt)
    mr = result.scalars().first()
    if not mr:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Material request not found.")
    return mr


@router.post(
    "/material-requests",
    response_model=MaterialRequestRead,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new material request",
)
async def create_material_request(
    payload: MaterialRequestCreate,
    db: AsyncSession = Depends(get_db),
    _ = Depends(require_tier_2),
):
    # Validate all item IDs exist
    for line in payload.items:
        item = await db.get(InventoryItem, line.item_id)
        if not item:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Item ID {line.item_id} not found in inventory.",
            )
        if line.warehouse_id:
            wh = await db.get(Warehouse, line.warehouse_id)
            if not wh:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Warehouse ID {line.warehouse_id} not found.",
                )

    mr = MaterialRequest(
        request_date=payload.request_date,
        required_by=payload.required_by,
        status=MaterialRequestStatus.Draft,
        custom_attributes=payload.custom_attributes,
    )
    db.add(mr)
    await db.flush()

    for line in payload.items:
        db.add(MaterialRequestItem(
            request_id=mr.id,
            item_id=line.item_id,
            qty=line.qty,
            warehouse_id=line.warehouse_id,
            custom_attributes=line.custom_attributes,
        ))

    await db.commit()

    # Reload with items
    stmt = (
        select(MaterialRequest)
        .options(selectinload(MaterialRequest.items))
        .where(MaterialRequest.id == mr.id)
    )
    result = await db.execute(stmt)
    return result.scalar_one()


@router.patch(
    "/material-requests/{mr_id}",
    response_model=MaterialRequestRead,
    summary="Update a material request",
)
async def update_material_request(
    mr_id: UUID,
    payload: MaterialRequestUpdate,
    db: AsyncSession = Depends(get_db),
    _ = Depends(require_tier_2),
):
    mr = await db.get(MaterialRequest, mr_id)
    if not mr:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Material request not found.")
    if mr.status == MaterialRequestStatus.Cancelled:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Cannot update a cancelled request.")

    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(mr, field, value)

    await db.commit()

    stmt = (
        select(MaterialRequest)
        .options(selectinload(MaterialRequest.items))
        .where(MaterialRequest.id == mr_id)
    )
    result = await db.execute(stmt)
    return result.scalar_one()


# ══════════════════════════════════════════════════════════════════════════════
# Purchase Orders
# ══════════════════════════════════════════════════════════════════════════════

@router.get(
    "/purchase-orders",
    response_model=List[PurchaseOrderRead],
    summary="List all purchase orders",
)
async def list_purchase_orders(
    supplier_id: Optional[UUID] = Query(default=None),
    status_filter: Optional[PurchaseOrderStatus] = Query(default=None, alias="status"),
    db: AsyncSession = Depends(get_db),
    _ = Depends(require_tier_4),
):
    stmt = (
        select(PurchaseOrder)
        .options(selectinload(PurchaseOrder.items))
        .order_by(PurchaseOrder.order_date.desc())
    )
    if supplier_id:
        stmt = stmt.where(PurchaseOrder.supplier_id == supplier_id)
    if status_filter:
        stmt = stmt.where(PurchaseOrder.status == status_filter)
    result = await db.execute(stmt)
    return result.scalars().all()


@router.get(
    "/purchase-orders/{po_id}",
    response_model=PurchaseOrderRead,
    summary="Get a purchase order by ID",
)
async def get_purchase_order(
    po_id: UUID,
    db: AsyncSession = Depends(get_db),
    _ = Depends(require_tier_4),
):
    stmt = (
        select(PurchaseOrder)
        .options(selectinload(PurchaseOrder.items))
        .where(PurchaseOrder.id == po_id)
    )
    result = await db.execute(stmt)
    po = result.scalars().first()
    if not po:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Purchase order not found.")
    return po


@router.post(
    "/purchase-orders",
    response_model=PurchaseOrderRead,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new purchase order",
)
async def create_purchase_order(
    payload: PurchaseOrderCreate,
    db: AsyncSession = Depends(get_db),
    _ = Depends(require_tier_2),
):
    # Validate supplier
    supplier = await db.get(Supplier, payload.supplier_id)
    if not supplier or not supplier.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Supplier not found or is inactive.",
        )
    # Validate material request if provided
    if payload.material_request_id:
        mr = await db.get(MaterialRequest, payload.material_request_id)
        if not mr:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Material request not found.",
            )
    # Validate all items and warehouses
    computed_total = Decimal("0.0000")
    for line in payload.items:
        item = await db.get(InventoryItem, line.item_id)
        if not item:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Item ID {line.item_id} not found in inventory.",
            )
        if line.warehouse_id:
            wh = await db.get(Warehouse, line.warehouse_id)
            if not wh:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Warehouse ID {line.warehouse_id} not found.",
                )
        computed_total += line.qty * line.rate

    po = PurchaseOrder(
        supplier_id=payload.supplier_id,
        order_date=payload.order_date,
        total_amount=payload.total_amount or computed_total,
        material_request_id=payload.material_request_id,
        status=PurchaseOrderStatus.Draft,
        custom_attributes=payload.custom_attributes,
    )
    db.add(po)
    await db.flush()

    for line in payload.items:
        db.add(PurchaseOrderItem(
            order_id=po.id,
            item_id=line.item_id,
            qty=line.qty,
            rate=line.rate,
            warehouse_id=line.warehouse_id,
            custom_attributes=line.custom_attributes,
        ))

    await db.commit()

    stmt = (
        select(PurchaseOrder)
        .options(selectinload(PurchaseOrder.items))
        .where(PurchaseOrder.id == po.id)
    )
    result = await db.execute(stmt)
    return result.scalar_one()


@router.patch(
    "/purchase-orders/{po_id}",
    response_model=PurchaseOrderRead,
    summary="Update a purchase order",
)
async def update_purchase_order(
    po_id: UUID,
    payload: PurchaseOrderUpdate,
    db: AsyncSession = Depends(get_db),
    _ = Depends(require_tier_2),
):
    po = await db.get(PurchaseOrder, po_id)
    if not po:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Purchase order not found.")
    if po.status == PurchaseOrderStatus.Cancelled:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Cannot update a cancelled PO.")

    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(po, field, value)

    await db.commit()

    stmt = (
        select(PurchaseOrder)
        .options(selectinload(PurchaseOrder.items))
        .where(PurchaseOrder.id == po_id)
    )
    result = await db.execute(stmt)
    return result.scalar_one()


@router.post(
    "/purchase-orders/{po_id}/submit",
    response_model=PurchaseOrderRead,
    summary="Submit a purchase order",
)
async def submit_purchase_order(
    po_id: UUID,
    db: AsyncSession = Depends(get_db),
    _ = Depends(require_tier_2),
):
    stmt = (
        select(PurchaseOrder)
        .options(selectinload(PurchaseOrder.items))
        .where(PurchaseOrder.id == po_id)
    )
    result = await db.execute(stmt)
    po = result.scalars().first()
    if not po:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Purchase order not found.")
    if po.status != PurchaseOrderStatus.Draft:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Only Draft POs can be submitted. Current status: {po.status}",
        )

    po.status = PurchaseOrderStatus.Submitted
    await db.commit()

    stmt = (
        select(PurchaseOrder)
        .options(selectinload(PurchaseOrder.items))
        .where(PurchaseOrder.id == po_id)
    )
    result = await db.execute(stmt)
    return result.scalar_one()


# ══════════════════════════════════════════════════════════════════════════════
# Purchase Receipts (GRN)
# ══════════════════════════════════════════════════════════════════════════════

@router.get(
    "/purchase-receipts",
    response_model=List[PurchaseReceiptRead],
    summary="List all purchase receipts",
)
async def list_purchase_receipts(
    supplier_id: Optional[UUID] = Query(default=None),
    purchase_order_id: Optional[UUID] = Query(default=None),
    db: AsyncSession = Depends(get_db),
    _ = Depends(require_tier_4),
):
    stmt = (
        select(PurchaseReceipt)
        .options(selectinload(PurchaseReceipt.items))
        .order_by(PurchaseReceipt.receipt_date.desc())
    )
    if supplier_id:
        stmt = stmt.where(PurchaseReceipt.supplier_id == supplier_id)
    if purchase_order_id:
        stmt = stmt.where(PurchaseReceipt.purchase_order_id == purchase_order_id)
    result = await db.execute(stmt)
    return result.scalars().all()


@router.get(
    "/purchase-receipts/{receipt_id}",
    response_model=PurchaseReceiptRead,
    summary="Get a purchase receipt by ID",
)
async def get_purchase_receipt(
    receipt_id: UUID,
    db: AsyncSession = Depends(get_db),
    _ = Depends(require_tier_4),
):
    stmt = (
        select(PurchaseReceipt)
        .options(selectinload(PurchaseReceipt.items))
        .where(PurchaseReceipt.id == receipt_id)
    )
    result = await db.execute(stmt)
    receipt = result.scalars().first()
    if not receipt:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Purchase receipt not found.")
    return receipt


@router.post(
    "/purchase-receipts",
    response_model=PurchaseReceiptRead,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new purchase receipt (GRN)",
)
async def create_purchase_receipt(
    payload: PurchaseReceiptCreate,
    db: AsyncSession = Depends(get_db),
    _ = Depends(require_tier_2),
):
    # Validate supplier
    supplier = await db.get(Supplier, payload.supplier_id)
    if not supplier:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Supplier not found.",
        )

    # Validate PO if provided
    if payload.purchase_order_id:
        po = await db.get(PurchaseOrder, payload.purchase_order_id)
        if not po:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Purchase order not found.",
            )
        if po.supplier_id != payload.supplier_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Purchase order supplier does not match receipt supplier.",
            )

    # Validate items and warehouses
    for line in payload.items:
        item = await db.get(InventoryItem, line.item_id)
        if not item:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Item ID {line.item_id} not found in inventory.",
            )
        wh = await db.get(Warehouse, line.warehouse_id)
        if not wh:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Warehouse ID {line.warehouse_id} not found.",
            )

    receipt = PurchaseReceipt(
        supplier_id=payload.supplier_id,
        purchase_order_id=payload.purchase_order_id,
        receipt_date=payload.receipt_date,
        status=DocumentStatus.Draft,
        custom_attributes=payload.custom_attributes,
    )
    db.add(receipt)
    await db.flush()

    for line in payload.items:
        db.add(PurchaseReceiptItem(
            receipt_id=receipt.id,
            item_id=line.item_id,
            warehouse_id=line.warehouse_id,
            accepted_qty=line.accepted_qty,
            rate=line.rate,
            purchase_order_item_id=line.purchase_order_item_id,
            custom_attributes=line.custom_attributes,
        ))

    await db.commit()

    stmt = (
        select(PurchaseReceipt)
        .options(selectinload(PurchaseReceipt.items))
        .where(PurchaseReceipt.id == receipt.id)
    )
    result = await db.execute(stmt)
    return result.scalar_one()


@router.post(
    "/purchase-receipts/{receipt_id}/submit",
    response_model=PurchaseReceiptRead,
    summary="Submit a GRN — moves stock IN via the inventory service",
)
async def submit_purchase_receipt(
    receipt_id: UUID,
    db: AsyncSession = Depends(get_db),
    _ = Depends(require_tier_2),
):
    stmt = (
        select(PurchaseReceipt)
        .options(selectinload(PurchaseReceipt.items))
        .where(PurchaseReceipt.id == receipt_id)
    )
    result = await db.execute(stmt)
    receipt = result.scalars().first()
    if not receipt:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Purchase receipt not found.")

    if receipt.status == DocumentStatus.Submitted:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Purchase receipt is already submitted.",
        )
    if receipt.status == DocumentStatus.Cancelled:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot submit a cancelled receipt.",
        )

    receipt.status = DocumentStatus.Submitted

    # Cross-workspace call: post stock IN movements for each received line
    from app.workspaces.inventory.services.stock_service import process_stock_movement
    for line in receipt.items:
        await process_stock_movement(
            db=db,
            item_id=line.item_id,
            warehouse_id=line.warehouse_id,
            qty=line.accepted_qty,
            txn_type="IN",
            reference=f"GRN:{receipt.id}",
        )

    # If the receipt is linked to a PO, advance PO status to Received
    if receipt.purchase_order_id:
        po = await db.get(PurchaseOrder, receipt.purchase_order_id)
        if po and po.status == PurchaseOrderStatus.Submitted:
            po.status = PurchaseOrderStatus.Received

    await db.commit()

    stmt = (
        select(PurchaseReceipt)
        .options(selectinload(PurchaseReceipt.items))
        .where(PurchaseReceipt.id == receipt_id)
    )
    result = await db.execute(stmt)
    return result.scalar_one()


# ══════════════════════════════════════════════════════════════════════════════
# Purchase Invoices
# ══════════════════════════════════════════════════════════════════════════════

@router.get(
    "/purchase-invoices",
    response_model=List[PurchaseInvoiceRead],
    summary="List all purchase invoices",
)
async def list_purchase_invoices(
    supplier_id: Optional[UUID] = Query(default=None),
    status_filter: Optional[InvoiceStatus] = Query(default=None, alias="status"),
    db: AsyncSession = Depends(get_db),
    _ = Depends(require_tier_4),
):
    stmt = select(PurchaseInvoice).order_by(PurchaseInvoice.invoice_date.desc())
    if supplier_id:
        stmt = stmt.where(PurchaseInvoice.supplier_id == supplier_id)
    if status_filter:
        stmt = stmt.where(PurchaseInvoice.status == status_filter)
    result = await db.execute(stmt)
    return result.scalars().all()


@router.get(
    "/purchase-invoices/{invoice_id}",
    response_model=PurchaseInvoiceRead,
    summary="Get a purchase invoice by ID",
)
async def get_purchase_invoice(
    invoice_id: UUID,
    db: AsyncSession = Depends(get_db),
    _ = Depends(require_tier_4),
):
    invoice = await db.get(PurchaseInvoice, invoice_id)
    if not invoice:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Purchase invoice not found.")
    return invoice


@router.post(
    "/purchase-invoices",
    response_model=PurchaseInvoiceRead,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new purchase invoice",
)
async def create_purchase_invoice(
    payload: PurchaseInvoiceCreate,
    db: AsyncSession = Depends(get_db),
    _ = Depends(require_tier_2),
):
    # Validate supplier
    supplier = await db.get(Supplier, payload.supplier_id)
    if not supplier:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Supplier not found.",
        )

    # Validate receipt if provided
    if payload.purchase_receipt_id:
        receipt = await db.get(PurchaseReceipt, payload.purchase_receipt_id)
        if not receipt:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Purchase receipt not found.",
            )
        if receipt.status != DocumentStatus.Submitted:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Can only raise an invoice against a Submitted receipt.",
            )

    invoice = PurchaseInvoice(**payload.model_dump())
    db.add(invoice)
    await db.commit()
    await db.refresh(invoice)
    return invoice


@router.patch(
    "/purchase-invoices/{invoice_id}",
    response_model=PurchaseInvoiceRead,
    summary="Update a purchase invoice",
)
async def update_purchase_invoice(
    invoice_id: UUID,
    payload: PurchaseInvoiceUpdate,
    db: AsyncSession = Depends(get_db),
    _ = Depends(require_tier_2),
):
    invoice = await db.get(PurchaseInvoice, invoice_id)
    if not invoice:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Purchase invoice not found.")
    if invoice.status in (InvoiceStatus.Paid, InvoiceStatus.Cancelled):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot update a {invoice.status} invoice.",
        )

    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(invoice, field, value)

    await db.commit()
    await db.refresh(invoice)
    return invoice


@router.post(
    "/purchase-invoices/{invoice_id}/submit",
    response_model=PurchaseInvoiceRead,
    summary="Submit a purchase invoice",
)
async def submit_purchase_invoice(
    invoice_id: UUID,
    db: AsyncSession = Depends(get_db),
    _ = Depends(require_tier_2),
):
    invoice = await db.get(PurchaseInvoice, invoice_id)
    if not invoice:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Purchase invoice not found.")
    if invoice.status != InvoiceStatus.Draft:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Only Draft invoices can be submitted. Current status: {invoice.status}",
        )

    invoice.status = InvoiceStatus.Submitted
    await db.commit()
    await db.refresh(invoice)
    return invoice
