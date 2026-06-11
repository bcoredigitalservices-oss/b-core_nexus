import uuid
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status, BackgroundTasks
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies.auth import require_workspace_access
from app.database import get_db

from app.workspaces.crm.models import (
    Customer,
    CustomerLifecycleStatus,
    Contact,
    InteractionLog,
    Quotation,
    QuotationLine,
    QuotationStatus,
    SalesOrder,
    SalesOrderLine,
    SalesOrderStatus,
    CrmTask,
    TaskStatus,
    TaskPriority,
)
from app.workspaces.crm.schemas import (
    CustomerCreate,
    CustomerUpdate,
    CustomerResponse,
    PaginatedCustomersResponse,
    ContactCreate,
    ContactResponse,
    PaginatedContactsResponse,
    InteractionLogCreate,
    InteractionLogResponse,
    QuotationCreate,
    QuotationResponse,
    PaginatedQuotationsResponse,
    QuotationStatusUpdate,
    TaskCreate,
    TaskUpdate,
    TaskResponse,
    PaginatedTasksResponse,
    SalesOrderCreate,
    SalesOrderResponse,
    PaginatedSalesOrdersResponse,
)
from app.workspaces.inventory.models import InventoryItem
from app.core.events.triggers import process_sales_order_fulfillment
from sqlalchemy.orm import selectinload

router = APIRouter(
    prefix="/crm",
    tags=["CRM"],
    dependencies=[Depends(require_workspace_access("crm"))],
)


@router.get("/meta", summary="CRM Workspace Metadata")
async def get_crm_meta():
    return {
        "workspace": "crm",
        "status": "initialized",
        "accessible_features": [
            "Customer Relationship Management", "Lead Management", "Sales Pipeline",
            "Contact Management", "Quotations", "Tasks & ToDo",
        ],
    }


# ══════════════════════════════════════════════════════════════════════════════
# Customers / Pipeline & Leads
# ══════════════════════════════════════════════════════════════════════════════

@router.post("/customers", response_model=CustomerResponse, status_code=status.HTTP_201_CREATED)
async def create_customer(payload: CustomerCreate, db: AsyncSession = Depends(get_db)):
    existing = await db.execute(select(Customer).where(Customer.email == payload.email))
    if existing.scalars().first():
        raise HTTPException(status_code=409, detail=f"Customer with email '{payload.email}' already exists.")
    customer = Customer(**payload.model_dump())
    db.add(customer)
    await db.flush()
    await db.commit()
    await db.refresh(customer)
    return customer


@router.get("/customers", response_model=PaginatedCustomersResponse)
async def list_customers(
    lifecycle_status: Optional[CustomerLifecycleStatus] = Query(default=None),
    search: Optional[str] = Query(default=None),
    limit: int = Query(default=50, ge=1, le=500),
    offset: int = Query(default=0, ge=0),
    db: AsyncSession = Depends(get_db),
):
    count_stmt = select(func.count()).select_from(Customer)
    if lifecycle_status:
        count_stmt = count_stmt.where(Customer.lifecycle_status == lifecycle_status)
    if search:
        count_stmt = count_stmt.where(Customer.company_name.ilike(f"%{search}%"))

    total = (await db.execute(count_stmt)).scalar_one()

    query = select(Customer).order_by(Customer.company_name)
    if lifecycle_status:
        query = query.where(Customer.lifecycle_status == lifecycle_status)
    if search:
        query = query.where(Customer.company_name.ilike(f"%{search}%"))

    customers = (await db.execute(query.offset(offset).limit(limit))).scalars().all()
    return PaginatedCustomersResponse(total=total, limit=limit, offset=offset, customers=customers)


@router.patch("/customers/{customer_id}", response_model=CustomerResponse)
async def update_customer(customer_id: uuid.UUID, payload: CustomerUpdate, db: AsyncSession = Depends(get_db)):
    res = await db.execute(select(Customer).where(Customer.id == customer_id))
    customer = res.scalars().first()
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found.")
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(customer, field, value)
    await db.commit()
    await db.refresh(customer)
    return customer


@router.delete("/customers/{customer_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_customer(customer_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    res = await db.execute(select(Customer).where(Customer.id == customer_id))
    customer = res.scalars().first()
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found.")
    await db.delete(customer)
    await db.commit()


# ══════════════════════════════════════════════════════════════════════════════
# Contacts
# ══════════════════════════════════════════════════════════════════════════════

@router.post("/contacts", response_model=ContactResponse, status_code=status.HTTP_201_CREATED)
async def create_contact(payload: ContactCreate, db: AsyncSession = Depends(get_db)):
    cust = await db.execute(select(Customer).where(Customer.id == payload.customer_id))
    if not cust.scalars().first():
        raise HTTPException(status_code=404, detail="Customer not found.")
    contact = Contact(**payload.model_dump())
    db.add(contact)
    await db.flush()
    await db.commit()
    await db.refresh(contact)
    return contact


@router.get("/contacts", response_model=PaginatedContactsResponse)
async def list_contacts(
    customer_id: Optional[uuid.UUID] = Query(default=None),
    search: Optional[str] = Query(default=None),
    limit: int = Query(default=100, ge=1, le=500),
    db: AsyncSession = Depends(get_db),
):
    stmt = select(Contact).order_by(Contact.last_name)
    if customer_id:
        stmt = stmt.where(Contact.customer_id == customer_id)
    if search:
        stmt = stmt.where(
            (Contact.first_name.ilike(f"%{search}%")) | (Contact.last_name.ilike(f"%{search}%"))
        )
    contacts = (await db.execute(stmt.limit(limit))).scalars().all()
    count = (await db.execute(select(func.count()).select_from(stmt.subquery()))).scalar_one()
    return PaginatedContactsResponse(total=count, contacts=contacts)


@router.delete("/contacts/{contact_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_contact(contact_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    res = await db.execute(select(Contact).where(Contact.id == contact_id))
    contact = res.scalars().first()
    if not contact:
        raise HTTPException(status_code=404, detail="Contact not found.")
    await db.delete(contact)
    await db.commit()


# ══════════════════════════════════════════════════════════════════════════════
# Interaction Logs
# ══════════════════════════════════════════════════════════════════════════════

@router.post("/interactions", response_model=InteractionLogResponse, status_code=status.HTTP_201_CREATED)
async def create_interaction(payload: InteractionLogCreate, db: AsyncSession = Depends(get_db)):
    cust = await db.execute(select(Customer).where(Customer.id == payload.customer_id))
    if not cust.scalars().first():
        raise HTTPException(status_code=404, detail="Customer not found.")
    log = InteractionLog(**payload.model_dump())
    db.add(log)
    await db.flush()
    await db.commit()
    await db.refresh(log)
    return log


@router.get("/interactions", response_model=list[InteractionLogResponse])
async def list_interactions(
    customer_id: Optional[uuid.UUID] = Query(default=None),
    limit: int = Query(default=50, ge=1, le=200),
    db: AsyncSession = Depends(get_db),
):
    stmt = select(InteractionLog).order_by(InteractionLog.timestamp.desc())
    if customer_id:
        stmt = stmt.where(InteractionLog.customer_id == customer_id)
    logs = (await db.execute(stmt.limit(limit))).scalars().all()
    return logs


# ══════════════════════════════════════════════════════════════════════════════
# Quotations
# ══════════════════════════════════════════════════════════════════════════════

@router.post("/quotations", response_model=QuotationResponse, status_code=status.HTTP_201_CREATED)
async def create_quotation(payload: QuotationCreate, db: AsyncSession = Depends(get_db)):
    cust = await db.execute(select(Customer).where(Customer.id == payload.customer_id))
    if not cust.scalars().first():
        raise HTTPException(status_code=404, detail="Customer not found.")

    ref_check = await db.execute(select(Quotation).where(Quotation.quotation_reference == payload.quotation_reference))
    if ref_check.scalars().first():
        raise HTTPException(status_code=409, detail=f"Quotation reference '{payload.quotation_reference}' already exists.")

    q = Quotation(
        customer_id=payload.customer_id,
        quotation_reference=payload.quotation_reference,
        quotation_date=payload.quotation_date,
        expiry_date=payload.expiry_date,
        status=payload.status,
        notes=payload.notes,
        grand_total=payload.grand_total,
    )
    db.add(q)
    await db.flush()

    for line_data in payload.lines:
        line = QuotationLine(
            quotation_id=q.id,
            description=line_data.description,
            quantity=float(line_data.quantity),
            unit_price=float(line_data.unit_price),
            line_total=float(line_data.line_total),
        )
        db.add(line)

    await db.flush()
    await db.commit()

    result = await db.execute(
        select(Quotation).options(selectinload(Quotation.lines)).where(Quotation.id == q.id)
    )
    return result.scalars().first()


@router.get("/quotations", response_model=PaginatedQuotationsResponse)
async def list_quotations(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    status_filter: Optional[QuotationStatus] = Query(default=None, alias="status"),
    db: AsyncSession = Depends(get_db),
):
    stmt = select(Quotation)
    if status_filter:
        stmt = stmt.where(Quotation.status == status_filter)

    total = (await db.execute(select(func.count()).select_from(stmt.subquery()))).scalar_one()
    stmt = (
        stmt.order_by(Quotation.quotation_date.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
        .options(selectinload(Quotation.lines))
    )
    items = (await db.execute(stmt)).scalars().all()
    return PaginatedQuotationsResponse(total=total, page=page, page_size=page_size, items=items)


@router.patch("/quotations/{quotation_id}/status", response_model=QuotationResponse)
async def update_quotation_status(
    quotation_id: uuid.UUID,
    payload: QuotationStatusUpdate,
    db: AsyncSession = Depends(get_db),
):
    res = await db.execute(
        select(Quotation).options(selectinload(Quotation.lines)).where(Quotation.id == quotation_id)
    )
    q = res.scalars().first()
    if not q:
        raise HTTPException(status_code=404, detail="Quotation not found.")
    q.status = payload.status
    await db.commit()
    await db.refresh(q)
    return q


@router.delete("/quotations/{quotation_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_quotation(quotation_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    res = await db.execute(select(Quotation).where(Quotation.id == quotation_id))
    q = res.scalars().first()
    if not q:
        raise HTTPException(status_code=404, detail="Quotation not found.")
    await db.delete(q)
    await db.commit()


# ══════════════════════════════════════════════════════════════════════════════
# Tasks / ToDo
# ══════════════════════════════════════════════════════════════════════════════

@router.post("/tasks", response_model=TaskResponse, status_code=status.HTTP_201_CREATED)
async def create_task(payload: TaskCreate, db: AsyncSession = Depends(get_db)):
    if payload.customer_id:
        cust = await db.execute(select(Customer).where(Customer.id == payload.customer_id))
        if not cust.scalars().first():
            raise HTTPException(status_code=404, detail="Customer not found.")
    task = CrmTask(**payload.model_dump())
    db.add(task)
    await db.flush()
    await db.commit()
    await db.refresh(task)
    return task


@router.get("/tasks", response_model=PaginatedTasksResponse)
async def list_tasks(
    task_status: Optional[TaskStatus] = Query(default=None, alias="status"),
    priority: Optional[TaskPriority] = Query(default=None),
    customer_id: Optional[uuid.UUID] = Query(default=None),
    limit: int = Query(default=100, ge=1, le=500),
    db: AsyncSession = Depends(get_db),
):
    stmt = select(CrmTask).order_by(CrmTask.created_at.desc())
    if task_status:
        stmt = stmt.where(CrmTask.status == task_status)
    if priority:
        stmt = stmt.where(CrmTask.priority == priority)
    if customer_id:
        stmt = stmt.where(CrmTask.customer_id == customer_id)

    total = (await db.execute(select(func.count()).select_from(stmt.subquery()))).scalar_one()
    tasks = (await db.execute(stmt.limit(limit))).scalars().all()
    return PaginatedTasksResponse(total=total, items=tasks)


@router.patch("/tasks/{task_id}", response_model=TaskResponse)
async def update_task(task_id: uuid.UUID, payload: TaskUpdate, db: AsyncSession = Depends(get_db)):
    res = await db.execute(select(CrmTask).where(CrmTask.id == task_id))
    task = res.scalars().first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found.")
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(task, field, value)
    await db.commit()
    await db.refresh(task)
    return task


@router.delete("/tasks/{task_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_task(task_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    res = await db.execute(select(CrmTask).where(CrmTask.id == task_id))
    task = res.scalars().first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found.")
    await db.delete(task)
    await db.commit()


# ══════════════════════════════════════════════════════════════════════════════
# Sales Orders
# ══════════════════════════════════════════════════════════════════════════════

@router.post("/sales-orders", response_model=SalesOrderResponse, status_code=status.HTTP_201_CREATED)
async def create_sales_order(
    payload: SalesOrderCreate,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
):
    cust_res = await db.execute(select(Customer).where(Customer.id == payload.customer_id))
    if not cust_res.scalars().first():
        raise HTTPException(status_code=404, detail=f"Customer {payload.customer_id} not found.")

    ref_res = await db.execute(select(SalesOrder).where(SalesOrder.order_reference == payload.order_reference))
    if ref_res.scalars().first():
        raise HTTPException(status_code=409, detail=f"Sales Order '{payload.order_reference}' already exists.")

    for line in payload.lines:
        item_res = await db.execute(select(InventoryItem).where(InventoryItem.id == line.item_id))
        if not item_res.scalars().first():
            raise HTTPException(status_code=400, detail=f"Inventory item {line.item_id} not found.")

    order = SalesOrder(
        customer_id=payload.customer_id,
        order_reference=payload.order_reference,
        order_date=payload.order_date,
        status=payload.status,
        grand_total=payload.grand_total,
        custom_attributes=payload.custom_attributes,
    )
    db.add(order)
    await db.flush()

    for line_payload in payload.lines:
        line = SalesOrderLine(
            sales_order_id=order.id,
            item_id=line_payload.item_id,
            quantity=line_payload.quantity,
            unit_price=line_payload.unit_price,
            line_total=line_payload.line_total,
            custom_attributes=line_payload.custom_attributes,
        )
        db.add(line)

    await db.flush()
    await db.commit()

    if order.status == SalesOrderStatus.FULFILLED:
        background_tasks.add_task(process_sales_order_fulfillment, order.id)

    final_res = await db.execute(
        select(SalesOrder).where(SalesOrder.id == order.id).options(selectinload(SalesOrder.lines))
    )
    return final_res.scalars().first()


@router.post("/sales-orders/{order_id}/fulfill", response_model=SalesOrderResponse)
async def fulfill_sales_order(
    order_id: uuid.UUID,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
):
    res = await db.execute(
        select(SalesOrder).where(SalesOrder.id == order_id).options(selectinload(SalesOrder.lines))
    )
    order = res.scalars().first()
    if not order:
        raise HTTPException(status_code=404, detail=f"Sales order {order_id} not found.")
    if order.status == SalesOrderStatus.FULFILLED:
        raise HTTPException(status_code=400, detail=f"Order {order.order_reference} is already fulfilled.")

    order.status = SalesOrderStatus.FULFILLED
    await db.commit()
    background_tasks.add_task(process_sales_order_fulfillment, order.id)
    return order


@router.get("/sales-orders", response_model=PaginatedSalesOrdersResponse)
async def list_sales_orders(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
):
    stmt = select(SalesOrder)
    total = (await db.execute(select(func.count()).select_from(stmt.subquery()))).scalar_one()
    stmt = (
        stmt.order_by(SalesOrder.order_date.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
        .options(selectinload(SalesOrder.lines))
    )
    items = (await db.execute(stmt)).scalars().all()
    return PaginatedSalesOrdersResponse(items=items, total=total, page=page, page_size=page_size)


# ══════════════════════════════════════════════════════════════════════════════
# Analytics
# ══════════════════════════════════════════════════════════════════════════════

@router.get("/analytics/conversion-rate")
async def get_conversion_rate(db: AsyncSession = Depends(get_db)):
    active_count = (await db.execute(
        select(func.count(Customer.id)).where(Customer.lifecycle_status == CustomerLifecycleStatus.ACTIVE_CUSTOMER)
    )).scalar() or 0
    lead_count = (await db.execute(
        select(func.count(Customer.id)).where(Customer.lifecycle_status == CustomerLifecycleStatus.LEAD)
    )).scalar() or 0
    rate = float(active_count) / float(lead_count) if lead_count > 0 else 0.0
    return {"active_customers": active_count, "leads": lead_count, "conversion_rate": rate}

# ─── Register EDA Event Subscribers ───────────────────────────────────────────
from app.workspaces.crm.events import register_crm_events
register_crm_events()
