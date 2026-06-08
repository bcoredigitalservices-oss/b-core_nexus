from datetime import date, datetime
from decimal import Decimal
from typing import Any, Dict, List, Optional
from uuid import UUID
from pydantic import BaseModel, Field, model_validator

from app.workspaces.crm.models import (
    CustomerLifecycleStatus,
    InteractionType,
    SalesOrderStatus,
    QuotationStatus,
    TaskStatus,
    TaskPriority,
)


# ─── Customer Schemas ─────────────────────────────────────────────────────────

class CustomerBase(BaseModel):
    company_name: str = Field(..., min_length=1, max_length=255)
    contact_name: str = Field(..., min_length=1, max_length=255)
    email: str = Field(..., min_length=3, max_length=255)
    phone: Optional[str] = Field(default=None, max_length=50)
    lifecycle_status: CustomerLifecycleStatus = Field(default=CustomerLifecycleStatus.LEAD)
    custom_attributes: Dict[str, Any] = Field(default_factory=dict)


class CustomerCreate(CustomerBase):
    pass


class CustomerUpdate(BaseModel):
    company_name: Optional[str] = Field(default=None, min_length=1, max_length=255)
    contact_name: Optional[str] = Field(default=None, min_length=1, max_length=255)
    phone: Optional[str] = Field(default=None, max_length=50)
    lifecycle_status: Optional[CustomerLifecycleStatus] = None


class CustomerResponse(CustomerBase):
    id: UUID
    created_at: datetime

    model_config = {"from_attributes": True}


# ─── Contact Schemas ──────────────────────────────────────────────────────────

class ContactCreate(BaseModel):
    customer_id: UUID
    first_name: str = Field(..., min_length=1, max_length=150)
    last_name: str = Field(..., min_length=1, max_length=150)
    email: Optional[str] = Field(default=None, max_length=255)
    phone: Optional[str] = Field(default=None, max_length=50)
    job_title: Optional[str] = Field(default=None, max_length=255)
    is_primary: bool = Field(default=False)


class ContactResponse(ContactCreate):
    id: UUID
    created_at: datetime

    model_config = {"from_attributes": True}


class PaginatedContactsResponse(BaseModel):
    total: int
    contacts: List[ContactResponse]


# ─── InteractionLog Schemas ───────────────────────────────────────────────────

class InteractionLogCreate(BaseModel):
    customer_id: UUID
    interaction_type: InteractionType
    summary: str = Field(..., min_length=1)
    logged_by_user_id: UUID
    custom_attributes: Dict[str, Any] = Field(default_factory=dict)


class InteractionLogResponse(InteractionLogCreate):
    id: UUID
    timestamp: datetime

    model_config = {"from_attributes": True}


# ─── Paginated Customer Envelope ──────────────────────────────────────────────

class PaginatedCustomersResponse(BaseModel):
    total: int
    limit: int
    offset: int
    customers: List[CustomerResponse]


# ─── Quotation Schemas ────────────────────────────────────────────────────────

class QuotationLineCreate(BaseModel):
    description: str = Field(..., min_length=1, max_length=500)
    quantity: Decimal = Field(..., gt=Decimal("0"))
    unit_price: Decimal = Field(..., ge=Decimal("0"))
    line_total: Decimal = Field(..., ge=Decimal("0"))

    @model_validator(mode="after")
    def validate_line_total(self) -> "QuotationLineCreate":
        expected = self.quantity * self.unit_price
        if abs(self.line_total - expected) > Decimal("0.01"):
            raise ValueError(f"line_total ({self.line_total}) != quantity * unit_price ({expected})")
        return self


class QuotationLineResponse(QuotationLineCreate):
    id: UUID
    quotation_id: UUID

    model_config = {"from_attributes": True}


class QuotationCreate(BaseModel):
    customer_id: UUID
    quotation_reference: str = Field(..., min_length=1, max_length=100)
    quotation_date: date
    expiry_date: Optional[date] = None
    status: QuotationStatus = Field(default=QuotationStatus.DRAFT)
    notes: Optional[str] = None
    grand_total: Decimal = Field(..., ge=Decimal("0"))
    lines: List[QuotationLineCreate] = Field(..., min_length=1)

    @model_validator(mode="after")
    def validate_grand_total(self) -> "QuotationCreate":
        calculated = sum(line.line_total for line in self.lines)
        if abs(self.grand_total - calculated) > Decimal("0.01"):
            raise ValueError(f"grand_total ({self.grand_total}) != sum of lines ({calculated})")
        return self


class QuotationResponse(BaseModel):
    id: UUID
    customer_id: UUID
    quotation_reference: str
    quotation_date: date
    expiry_date: Optional[date]
    status: QuotationStatus
    notes: Optional[str]
    grand_total: Decimal
    lines: List[QuotationLineResponse]
    created_at: datetime

    model_config = {"from_attributes": True}


class PaginatedQuotationsResponse(BaseModel):
    total: int
    page: int
    page_size: int
    items: List[QuotationResponse]


class QuotationStatusUpdate(BaseModel):
    status: QuotationStatus


# ─── Task / ToDo Schemas ──────────────────────────────────────────────────────

class TaskCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=500)
    description: Optional[str] = None
    customer_id: Optional[UUID] = None
    assigned_user_id: Optional[UUID] = None
    due_date: Optional[date] = None
    status: TaskStatus = Field(default=TaskStatus.TODO)
    priority: TaskPriority = Field(default=TaskPriority.MEDIUM)


class TaskUpdate(BaseModel):
    title: Optional[str] = Field(default=None, min_length=1, max_length=500)
    description: Optional[str] = None
    customer_id: Optional[UUID] = None
    assigned_user_id: Optional[UUID] = None
    due_date: Optional[date] = None
    status: Optional[TaskStatus] = None
    priority: Optional[TaskPriority] = None


class TaskResponse(TaskCreate):
    id: UUID
    created_at: datetime

    model_config = {"from_attributes": True}


class PaginatedTasksResponse(BaseModel):
    total: int
    items: List[TaskResponse]


# ─── Sales Order Line Schemas ──────────────────────────────────────────────────

class SalesOrderLineBase(BaseModel):
    item_id: UUID
    quantity: Decimal = Field(..., gt=Decimal("0.0"))
    unit_price: Decimal = Field(..., ge=Decimal("0.0"))
    line_total: Decimal = Field(..., ge=Decimal("0.0"))
    custom_attributes: Dict[str, Any] = Field(default_factory=dict)


class SalesOrderLineCreate(SalesOrderLineBase):
    @model_validator(mode="after")
    def validate_line_total(self) -> "SalesOrderLineCreate":
        expected = self.quantity * self.unit_price
        if abs(self.line_total - expected) > Decimal("0.001"):
            raise ValueError(f"Line total ({self.line_total}) does not match quantity * unit_price ({expected}).")
        return self


class SalesOrderLineResponse(SalesOrderLineBase):
    id: UUID
    sales_order_id: UUID
    created_at: datetime

    model_config = {"from_attributes": True}


# ─── Sales Order Schemas ─────────────────────────────────────────────────────

class SalesOrderBase(BaseModel):
    customer_id: UUID
    order_reference: str = Field(..., min_length=1, max_length=100)
    order_date: date
    status: SalesOrderStatus = Field(default=SalesOrderStatus.DRAFT)
    grand_total: Decimal = Field(..., ge=Decimal("0.0"))
    custom_attributes: Dict[str, Any] = Field(default_factory=dict)


class SalesOrderCreate(SalesOrderBase):
    lines: List[SalesOrderLineCreate] = Field(..., min_length=1)

    @model_validator(mode="after")
    def validate_grand_total(self) -> "SalesOrderCreate":
        calculated_total = sum(line.line_total for line in self.lines)
        if abs(self.grand_total - calculated_total) > Decimal("0.001"):
            raise ValueError(f"Grand total ({self.grand_total}) does not match the sum of line totals ({calculated_total}).")
        return self


class SalesOrderResponse(SalesOrderBase):
    id: UUID
    lines: List[SalesOrderLineResponse]
    created_at: datetime

    model_config = {"from_attributes": True}


class PaginatedSalesOrdersResponse(BaseModel):
    items: List[SalesOrderResponse]
    total: int
    page: int
    page_size: int
