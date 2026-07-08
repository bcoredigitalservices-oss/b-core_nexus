import uuid
from datetime import datetime, date
from typing import List, Optional
from pydantic import BaseModel, ConfigDict

from app.models.sales import QuotationStatus, QuotationType, DiscountType, SalesOrderStatus

# ---------------------------------------------------------
# Product Categories
# ---------------------------------------------------------
class ProductCategoryBase(BaseModel):
    name: str
    description: Optional[str] = None
    parent_id: Optional[uuid.UUID] = None

class ProductCategoryCreate(ProductCategoryBase):
    pass

class ProductCategoryUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    parent_id: Optional[uuid.UUID] = None

class ProductCategoryRead(ProductCategoryBase):
    id: uuid.UUID
    model_config = ConfigDict(from_attributes=True)


# ---------------------------------------------------------
# Products
# ---------------------------------------------------------
class ProductBase(BaseModel):
    sku: str
    serial_number: Optional[str] = None
    name: str
    description: Optional[str] = None
    category_id: Optional[uuid.UUID] = None
    unit_of_measure: str = "units"
    standard_price: float = 0.0
    min_order_qty: int = 1
    lead_time_days: int = 0
    stock_qty: int = 0
    image_url: Optional[str] = None
    is_active: bool = True

class ProductCreate(ProductBase):
    pass

class ProductUpdate(BaseModel):
    sku: Optional[str] = None
    serial_number: Optional[str] = None
    name: Optional[str] = None
    description: Optional[str] = None
    category_id: Optional[uuid.UUID] = None
    unit_of_measure: Optional[str] = None
    standard_price: Optional[float] = None
    min_order_qty: Optional[int] = None
    lead_time_days: Optional[int] = None
    stock_qty: Optional[int] = None
    image_url: Optional[str] = None
    is_active: Optional[bool] = None

class ProductRead(ProductBase):
    id: uuid.UUID
    created_at: datetime
    updated_at: datetime
    model_config = ConfigDict(from_attributes=True)


class ProductAttachmentCreate(BaseModel):
    file_name: str
    file_url: str

class ProductAttachmentRead(BaseModel):
    id: uuid.UUID
    file_name: str
    file_url: str
    uploaded_by: Optional[uuid.UUID] = None
    uploaded_at: datetime
    model_config = ConfigDict(from_attributes=True)


class ProductDetailRead(ProductRead):
    category: Optional[ProductCategoryRead] = None
    attachments: List[ProductAttachmentRead] = []
    model_config = ConfigDict(from_attributes=True)


# ---------------------------------------------------------
# Price Lists
# ---------------------------------------------------------
class PriceListBase(BaseModel):
    name: str
    currency: str = "NGN"
    is_default: bool = False

class PriceListCreate(PriceListBase):
    pass

class PriceListUpdate(BaseModel):
    name: Optional[str] = None
    currency: Optional[str] = None
    is_default: Optional[bool] = None

class PriceListRead(PriceListBase):
    id: uuid.UUID
    model_config = ConfigDict(from_attributes=True)


class PriceListItemBase(BaseModel):
    price: float

class PriceListItemCreate(PriceListItemBase):
    product_id: uuid.UUID

class PriceListItemUpdate(BaseModel):
    price: Optional[float] = None

class PriceListItemRead(PriceListItemBase):
    id: uuid.UUID
    price_list_id: uuid.UUID
    product_id: uuid.UUID
    product: Optional[ProductRead] = None
    model_config = ConfigDict(from_attributes=True)


class PriceListDetailRead(PriceListRead):
    items: List[PriceListItemRead] = []
    model_config = ConfigDict(from_attributes=True)


# ---------------------------------------------------------
# Quotation Templates
# ---------------------------------------------------------
class QuotationTemplateBase(BaseModel):
    name: str
    description: Optional[str] = None
    template_file: str
    is_active: bool = True
    is_default: bool = False

class QuotationTemplateCreate(QuotationTemplateBase):
    pass

class QuotationTemplateUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    template_file: Optional[str] = None
    is_active: Optional[bool] = None
    is_default: Optional[bool] = None

class QuotationTemplateRead(QuotationTemplateBase):
    id: uuid.UUID
    model_config = ConfigDict(from_attributes=True)


# ---------------------------------------------------------
# Quotation Line Items
# ---------------------------------------------------------
class QuotationLineItemBase(BaseModel):
    product_id: Optional[uuid.UUID] = None
    description: str
    quantity: float = 1.0
    unit_of_measure: Optional[str] = None
    unit_price: float = 0.0
    line_discount_type: Optional[str] = None
    line_discount_value: float = 0.0
    line_discount_amount: float = 0.0
    line_total: float = 0.0
    sort_order: int = 1

class QuotationLineItemCreate(QuotationLineItemBase):
    pass

class QuotationLineItemRead(QuotationLineItemBase):
    id: uuid.UUID
    quotation_id: uuid.UUID
    model_config = ConfigDict(from_attributes=True)


# ---------------------------------------------------------
# Quotations
# ---------------------------------------------------------
class QuotationBase(BaseModel):
    quotation_number: str
    version: int = 1
    parent_quotation_id: Optional[uuid.UUID] = None
    customer_id: uuid.UUID
    template_id: Optional[uuid.UUID] = None
    status: str = QuotationStatus.DRAFT.value
    validity_date: Optional[date] = None
    payment_terms: Optional[str] = None
    delivery_terms: Optional[str] = None
    currency: str = "NGN"
    subtotal: float = 0.0
    overall_discount_type: Optional[str] = None
    overall_discount_value: float = 0.0
    overall_discount_amount: float = 0.0
    taxable_amount: float = 0.0
    vat_rate: float = 7.5
    vat_amount: float = 0.0
    grand_total: float = 0.0
    quotation_type: Optional[str] = None
    internal_notes: Optional[str] = None
    customer_notes: Optional[str] = None
    lead_id: Optional[uuid.UUID] = None

class QuotationCreate(QuotationBase):
    pass

class QuotationUpdate(BaseModel):
    status: Optional[str] = None
    template_id: Optional[uuid.UUID] = None
    validity_date: Optional[date] = None
    payment_terms: Optional[str] = None
    delivery_terms: Optional[str] = None
    currency: Optional[str] = None
    subtotal: Optional[float] = None
    overall_discount_type: Optional[str] = None
    overall_discount_value: Optional[float] = None
    overall_discount_amount: Optional[float] = None
    taxable_amount: Optional[float] = None
    vat_rate: Optional[float] = None
    vat_amount: Optional[float] = None
    grand_total: Optional[float] = None
    quotation_type: Optional[str] = None
    internal_notes: Optional[str] = None
    customer_notes: Optional[str] = None

class QuotationRead(QuotationBase):
    id: uuid.UUID
    owner_id: Optional[uuid.UUID] = None
    prepared_by_id: Optional[uuid.UUID] = None
    approved_by_id: Optional[uuid.UUID] = None
    approved_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime
    model_config = ConfigDict(from_attributes=True)

class QuotationDetailRead(QuotationRead):
    line_items: List[QuotationLineItemRead] = []
    model_config = ConfigDict(from_attributes=True)


# ---------------------------------------------------------
# Sales Order Line Items
# ---------------------------------------------------------
class SalesOrderLineItemBase(BaseModel):
    product_id: Optional[uuid.UUID] = None
    description: str
    quantity: float = 1.0
    unit_of_measure: Optional[str] = None
    unit_price: float = 0.0
    line_total: float = 0.0

class SalesOrderLineItemCreate(SalesOrderLineItemBase):
    pass

class SalesOrderLineItemRead(SalesOrderLineItemBase):
    id: uuid.UUID
    sales_order_id: uuid.UUID
    model_config = ConfigDict(from_attributes=True)


# ---------------------------------------------------------
# Sales Orders
# ---------------------------------------------------------
class SalesOrderBase(BaseModel):
    order_number: str
    quotation_id: uuid.UUID
    customer_id: uuid.UUID
    status: str = SalesOrderStatus.CONFIRMED.value
    payment_terms: Optional[str] = None
    delivery_terms: Optional[str] = None
    currency: str = "NGN"
    subtotal: float = 0.0
    overall_discount_amount: float = 0.0
    vat_amount: float = 0.0
    grand_total: float = 0.0
    internal_notes: Optional[str] = None
    expected_delivery_date: Optional[date] = None
    actual_delivery_date: Optional[date] = None

class SalesOrderCreate(SalesOrderBase):
    pass

class SalesOrderUpdate(BaseModel):
    status: Optional[str] = None
    payment_terms: Optional[str] = None
    delivery_terms: Optional[str] = None
    internal_notes: Optional[str] = None
    expected_delivery_date: Optional[date] = None
    actual_delivery_date: Optional[date] = None

class SalesOrderRead(SalesOrderBase):
    id: uuid.UUID
    owner_id: Optional[uuid.UUID] = None
    created_at: datetime
    updated_at: datetime
    model_config = ConfigDict(from_attributes=True)

class SalesOrderDetailRead(SalesOrderRead):
    line_items: List[SalesOrderLineItemRead] = []
    model_config = ConfigDict(from_attributes=True)
