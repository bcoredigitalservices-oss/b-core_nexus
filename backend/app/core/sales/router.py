import uuid
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import delete
from sqlalchemy.orm import selectinload

from app.database import get_db
from app.core.auth.security import RequiresPermission, User
from app.core.common.rls import apply_ownership_filter, check_ownership
from app.models.sales import (
    ProductCategory, Product, ProductAttachment,
    PriceList, PriceListItem,
    QuotationTemplate, Quotation, QuotationLineItem, QuotationStatus,
    SalesOrder, SalesOrderLineItem, SalesOrderStatus
)
from app.core.sales.schemas import (
    ProductCategoryCreate, ProductCategoryUpdate, ProductCategoryRead,
    ProductCreate, ProductUpdate, ProductRead, ProductDetailRead,
    ProductAttachmentCreate, ProductAttachmentRead,
    PriceListCreate, PriceListUpdate, PriceListRead, PriceListDetailRead,
    PriceListItemCreate, PriceListItemUpdate, PriceListItemRead,
    QuotationTemplateCreate, QuotationTemplateUpdate, QuotationTemplateRead,
    QuotationCreate, QuotationUpdate, QuotationRead, QuotationDetailRead,
    QuotationLineItemCreate, QuotationLineItemRead,
    SalesOrderCreate, SalesOrderUpdate, SalesOrderRead, SalesOrderDetailRead
)

router = APIRouter(prefix="/sales", tags=["Sales"])


# ==========================================
# Products
# ==========================================

@router.post("/products", response_model=ProductRead, status_code=status.HTTP_201_CREATED)
async def create_product(
    payload: ProductCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(RequiresPermission("sales:create"))
):
    product = Product(**payload.model_dump())
    db.add(product)
    await db.commit()
    await db.refresh(product)
    return product

@router.get("/products", response_model=List[ProductRead])
async def list_products(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(RequiresPermission("sales:read"))
):
    res = await db.execute(select(Product).where(Product.is_active == True))
    return res.scalars().all()

@router.get("/products/{product_id}", response_model=ProductDetailRead)
async def get_product(
    product_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(RequiresPermission("sales:read"))
):
    res = await db.execute(
        select(Product).where(Product.id == product_id).options(
            selectinload(Product.category),
            selectinload(Product.attachments)
        )
    )
    product = res.scalars().first()
    if not product:
        raise HTTPException(404, "Product not found")
    return product

@router.put("/products/{product_id}", response_model=ProductRead)
async def update_product(
    product_id: uuid.UUID,
    payload: ProductUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(RequiresPermission("sales:write"))
):
    res = await db.execute(select(Product).where(Product.id == product_id))
    product = res.scalars().first()
    if not product: raise HTTPException(404, "Product not found")
    
    for key, value in payload.model_dump(exclude_unset=True).items():
        setattr(product, key, value)
    await db.commit()
    await db.refresh(product)
    return product


# ==========================================
# Price Lists
# ==========================================

@router.post("/price-lists", response_model=PriceListRead, status_code=status.HTTP_201_CREATED)
async def create_price_list(
    payload: PriceListCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(RequiresPermission("sales:create"))
):
    pl = PriceList(**payload.model_dump())
    db.add(pl)
    await db.commit()
    await db.refresh(pl)
    return pl

@router.get("/price-lists", response_model=List[PriceListRead])
async def list_price_lists(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(RequiresPermission("sales:read"))
):
    res = await db.execute(select(PriceList))
    return res.scalars().all()

@router.get("/price-lists/{list_id}", response_model=PriceListDetailRead)
async def get_price_list(
    list_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(RequiresPermission("sales:read"))
):
    res = await db.execute(
        select(PriceList).where(PriceList.id == list_id).options(
            selectinload(PriceList.items).selectinload(PriceListItem.product)
        )
    )
    pl = res.scalars().first()
    if not pl: raise HTTPException(404, "Price list not found")
    return pl

@router.post("/price-lists/{list_id}/items", response_model=PriceListItemRead)
async def add_price_list_item(
    list_id: uuid.UUID,
    payload: PriceListItemCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(RequiresPermission("sales:write"))
):
    item = PriceListItem(**payload.model_dump(), price_list_id=list_id)
    db.add(item)
    await db.commit()
    
    res = await db.execute(select(PriceListItem).where(PriceListItem.id == item.id).options(selectinload(PriceListItem.product)))
    return res.scalars().first()


# ==========================================
# Quotations
# ==========================================

@router.post("/quotations", response_model=QuotationRead, status_code=status.HTTP_201_CREATED)
async def create_quotation(
    payload: QuotationCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(RequiresPermission("sales:create"))
):
    quotation = Quotation(
        **payload.model_dump(),
        owner_id=current_user.id,
        prepared_by_id=current_user.id
    )
    db.add(quotation)
    await db.commit()
    await db.refresh(quotation)
    return quotation

@router.get("/quotations", response_model=List[QuotationRead])
async def list_quotations(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(RequiresPermission("sales:read"))
):
    query = select(Quotation)
    query = apply_ownership_filter(query, current_user, Quotation, "quotation")
    res = await db.execute(query)
    return res.scalars().all()

@router.get("/quotations/{quotation_id}", response_model=QuotationDetailRead)
async def get_quotation(
    quotation_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(RequiresPermission("sales:read"))
):
    res = await db.execute(
        select(Quotation).where(Quotation.id == quotation_id).options(
            selectinload(Quotation.line_items)
        )
    )
    quotation = res.scalars().first()
    if not quotation: raise HTTPException(404, "Quotation not found")
    await check_ownership(quotation, current_user, db, "quotation", "read")
    return quotation

@router.put("/quotations/{quotation_id}", response_model=QuotationRead)
async def update_quotation(
    quotation_id: uuid.UUID,
    payload: QuotationUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(RequiresPermission("sales:write"))
):
    res = await db.execute(select(Quotation).where(Quotation.id == quotation_id))
    quotation = res.scalars().first()
    if not quotation: raise HTTPException(404, "Quotation not found")
    await check_ownership(quotation, current_user, db, "quotation", "write")
    
    for key, value in payload.model_dump(exclude_unset=True).items():
        setattr(quotation, key, value)
    await db.commit()
    await db.refresh(quotation)
    return quotation

@router.post("/quotations/{quotation_id}/line-items", response_model=QuotationLineItemRead)
async def add_quotation_line_item(
    quotation_id: uuid.UUID,
    payload: QuotationLineItemCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(RequiresPermission("sales:write"))
):
    res = await db.execute(select(Quotation).where(Quotation.id == quotation_id))
    quotation = res.scalars().first()
    if not quotation: raise HTTPException(404, "Quotation not found")
    await check_ownership(quotation, current_user, db, "quotation", "write")
    
    line = QuotationLineItem(**payload.model_dump(), quotation_id=quotation_id)
    db.add(line)
    await db.commit()
    await db.refresh(line)
    return line


# ==========================================
# Sales Orders
# ==========================================

@router.post("/quotations/{quotation_id}/convert-to-order", response_model=SalesOrderRead)
async def convert_quotation_to_order(
    quotation_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(RequiresPermission("sales:create"))
):
    """
    Converts an accepted quotation to a Sales Order.
    """
    res = await db.execute(
        select(Quotation).where(Quotation.id == quotation_id).options(
            selectinload(Quotation.line_items)
        )
    )
    quotation = res.scalars().first()
    if not quotation: raise HTTPException(404, "Quotation not found")
    await check_ownership(quotation, current_user, db, "quotation", "write")
    
    # We allow conversion even if not fully 'accepted' to give flexibility,
    # but we will mark it accepted if it wasn't.
    
    order = SalesOrder(
        order_number=f"SO-{quotation.quotation_number}", # basic logic
        quotation_id=quotation.id,
        customer_id=quotation.customer_id,
        owner_id=quotation.owner_id,
        payment_terms=quotation.payment_terms,
        delivery_terms=quotation.delivery_terms,
        currency=quotation.currency,
        subtotal=quotation.subtotal,
        overall_discount_amount=quotation.overall_discount_amount,
        vat_amount=quotation.vat_amount,
        grand_total=quotation.grand_total,
        internal_notes=quotation.internal_notes
    )
    db.add(order)
    await db.flush()
    
    for q_line in quotation.line_items:
        o_line = SalesOrderLineItem(
            sales_order_id=order.id,
            product_id=q_line.product_id,
            description=q_line.description,
            quantity=q_line.quantity,
            unit_of_measure=q_line.unit_of_measure,
            unit_price=q_line.unit_price,
            line_total=q_line.line_total
        )
        db.add(o_line)
        
    quotation.status = QuotationStatus.ACCEPTED.value
    
    await db.commit()
    await db.refresh(order)
    return order


@router.get("/orders", response_model=List[SalesOrderRead])
async def list_sales_orders(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(RequiresPermission("sales:read"))
):
    query = select(SalesOrder)
    query = apply_ownership_filter(query, current_user, SalesOrder, "sales_order")
    res = await db.execute(query)
    return res.scalars().all()

@router.get("/orders/{order_id}", response_model=SalesOrderDetailRead)
async def get_sales_order(
    order_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(RequiresPermission("sales:read"))
):
    res = await db.execute(
        select(SalesOrder).where(SalesOrder.id == order_id).options(
            selectinload(SalesOrder.line_items)
        )
    )
    order = res.scalars().first()
    if not order: raise HTTPException(404, "Sales Order not found")
    await check_ownership(order, current_user, db, "sales_order", "read")
    return order

@router.put("/orders/{order_id}", response_model=SalesOrderRead)
async def update_sales_order(
    order_id: uuid.UUID,
    payload: SalesOrderUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(RequiresPermission("sales:write"))
):
    res = await db.execute(select(SalesOrder).where(SalesOrder.id == order_id))
    order = res.scalars().first()
    if not order: raise HTTPException(404, "Sales Order not found")
    await check_ownership(order, current_user, db, "sales_order", "write")
    
    for key, value in payload.model_dump(exclude_unset=True).items():
        setattr(order, key, value)
    await db.commit()
    await db.refresh(order)
    return order


# Deprecated Phase C Collaboration (Quotation Messages) endpoints have been moved to app/core/common/messages_router.py


