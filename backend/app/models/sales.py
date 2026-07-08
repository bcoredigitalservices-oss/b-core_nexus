import uuid
from datetime import datetime, date
from sqlalchemy import Column, String, Boolean, ForeignKey, Text, Float, DateTime, Integer, Date, Enum as SQLEnum
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func
import enum

from app.database import Base, CoreModel

# --- Enums ---

class DiscountType(str, enum.Enum):
    PERCENTAGE = "percentage"
    FIXED_AMOUNT = "fixed_amount"

class QuotationStatus(str, enum.Enum):
    DRAFT = "draft"
    SENT = "sent"
    ACCEPTED = "accepted"
    REJECTED = "rejected"
    EXPIRED = "expired"
    CANCELLED = "cancelled"

class QuotationType(str, enum.Enum):
    URGENT = "urgent"
    DAILY_USAGE = "daily_usage"
    HIGH_VALUE = "high_value"

class SalesOrderStatus(str, enum.Enum):
    CONFIRMED = "confirmed"
    IN_PROGRESS = "in_progress"
    SHIPPED = "shipped"
    DELIVERED = "delivered"
    CANCELLED = "cancelled"

# --- Models ---

class ProductCategory(CoreModel):
    __tablename__ = "product_categories"
    
    name: Mapped[str] = mapped_column(String, nullable=False)
    description: Mapped[str] = mapped_column(String, nullable=True)
    parent_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("product_categories.id", ondelete="SET NULL"), nullable=True)


class Product(CoreModel):
    __tablename__ = "products"

    sku: Mapped[str] = mapped_column(String, unique=True, nullable=False)
    serial_number: Mapped[str] = mapped_column(String, unique=True, nullable=True)
    name: Mapped[str] = mapped_column(String, nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=True)
    category_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("product_categories.id", ondelete="SET NULL"), nullable=True)
    unit_of_measure: Mapped[str] = mapped_column(String, nullable=False, default="units")
    standard_price: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    min_order_qty: Mapped[int] = mapped_column(Integer, default=1)
    lead_time_days: Mapped[int] = mapped_column(Integer, default=0)
    stock_qty: Mapped[int] = mapped_column(Integer, default=0)
    image_url: Mapped[str] = mapped_column(String, nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    category = relationship("ProductCategory")
    attachments = relationship("ProductAttachment", back_populates="product", cascade="all, delete")


class ProductAttachment(CoreModel):
    __tablename__ = "product_attachments"

    product_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("products.id", ondelete="CASCADE"), nullable=False)
    file_name: Mapped[str] = mapped_column(String, nullable=False)
    file_url: Mapped[str] = mapped_column(String, nullable=False)
    uploaded_by: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    uploaded_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    product = relationship("Product", back_populates="attachments")


class PriceList(CoreModel):
    __tablename__ = "price_lists"

    name: Mapped[str] = mapped_column(String, nullable=False)
    currency: Mapped[str] = mapped_column(String, nullable=False, default="NGN")
    is_default: Mapped[bool] = mapped_column(Boolean, default=False)
    
    items = relationship("PriceListItem", back_populates="price_list", cascade="all, delete")


class PriceListItem(CoreModel):
    __tablename__ = "price_list_items"
    
    price_list_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("price_lists.id", ondelete="CASCADE"), nullable=False)
    product_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("products.id", ondelete="CASCADE"), nullable=False)
    price: Mapped[float] = mapped_column(Float, nullable=False)

    price_list = relationship("PriceList", back_populates="items")
    product = relationship("Product")


class QuotationTemplate(CoreModel):
    __tablename__ = "quotation_templates"

    name: Mapped[str] = mapped_column(String, nullable=False)
    description: Mapped[str] = mapped_column(String, nullable=True)
    template_file: Mapped[str] = mapped_column(String, nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    is_default: Mapped[bool] = mapped_column(Boolean, default=False)


class Quotation(CoreModel):
    __tablename__ = "quotations"
    
    quotation_number: Mapped[str] = mapped_column(String, unique=True, nullable=False)
    version: Mapped[int] = mapped_column(Integer, default=1)
    parent_quotation_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("quotations.id", ondelete="SET NULL"), nullable=True)
    
    owner_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    customer_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("customers.id", ondelete="RESTRICT"), nullable=False)
    template_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("quotation_templates.id", ondelete="SET NULL"), nullable=True)
    
    status: Mapped[str] = mapped_column(String, default=QuotationStatus.DRAFT.value)
    validity_date: Mapped[date] = mapped_column(Date, nullable=True)
    payment_terms: Mapped[str] = mapped_column(String, nullable=True)
    delivery_terms: Mapped[str] = mapped_column(String, nullable=True)
    currency: Mapped[str] = mapped_column(String, default="NGN")
    
    subtotal: Mapped[float] = mapped_column(Float, default=0.0)
    overall_discount_type: Mapped[str] = mapped_column(String, nullable=True)
    overall_discount_value: Mapped[float] = mapped_column(Float, default=0.0)
    overall_discount_amount: Mapped[float] = mapped_column(Float, default=0.0)
    taxable_amount: Mapped[float] = mapped_column(Float, default=0.0)
    vat_rate: Mapped[float] = mapped_column(Float, default=7.5)
    vat_amount: Mapped[float] = mapped_column(Float, default=0.0)
    grand_total: Mapped[float] = mapped_column(Float, default=0.0)
    
    quotation_type: Mapped[str] = mapped_column(String, nullable=True)
    internal_notes: Mapped[str] = mapped_column(Text, nullable=True)
    customer_notes: Mapped[str] = mapped_column(Text, nullable=True)
    
    prepared_by_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    approved_by_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    approved_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=True)
    
    lead_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("leads.id", ondelete="SET NULL"), nullable=True)
    
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    line_items = relationship("QuotationLineItem", back_populates="quotation", cascade="all, delete")


class QuotationLineItem(CoreModel):
    __tablename__ = "quotation_line_items"
    
    quotation_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("quotations.id", ondelete="CASCADE"), nullable=False)
    product_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("products.id", ondelete="SET NULL"), nullable=True)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    quantity: Mapped[float] = mapped_column(Float, default=1.0)
    unit_of_measure: Mapped[str] = mapped_column(String, nullable=True)
    unit_price: Mapped[float] = mapped_column(Float, default=0.0)
    line_discount_type: Mapped[str] = mapped_column(String, nullable=True)
    line_discount_value: Mapped[float] = mapped_column(Float, default=0.0)
    line_discount_amount: Mapped[float] = mapped_column(Float, default=0.0)
    line_total: Mapped[float] = mapped_column(Float, default=0.0)
    sort_order: Mapped[int] = mapped_column(Integer, default=1)

    quotation = relationship("Quotation", back_populates="line_items")


class SalesOrder(CoreModel):
    __tablename__ = "sales_orders"
    
    order_number: Mapped[str] = mapped_column(String, unique=True, nullable=False)
    quotation_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("quotations.id", ondelete="RESTRICT"), nullable=False)
    customer_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("customers.id", ondelete="RESTRICT"), nullable=False)
    owner_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    
    status: Mapped[str] = mapped_column(String, default=SalesOrderStatus.CONFIRMED.value)
    payment_terms: Mapped[str] = mapped_column(String, nullable=True)
    delivery_terms: Mapped[str] = mapped_column(String, nullable=True)
    currency: Mapped[str] = mapped_column(String, default="NGN")
    
    subtotal: Mapped[float] = mapped_column(Float, default=0.0)
    overall_discount_amount: Mapped[float] = mapped_column(Float, default=0.0)
    vat_amount: Mapped[float] = mapped_column(Float, default=0.0)
    grand_total: Mapped[float] = mapped_column(Float, default=0.0)
    
    internal_notes: Mapped[str] = mapped_column(Text, nullable=True)
    expected_delivery_date: Mapped[date] = mapped_column(Date, nullable=True)
    actual_delivery_date: Mapped[date] = mapped_column(Date, nullable=True)
    
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    line_items = relationship("SalesOrderLineItem", back_populates="sales_order", cascade="all, delete")


class SalesOrderLineItem(CoreModel):
    __tablename__ = "sales_order_line_items"
    
    sales_order_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("sales_orders.id", ondelete="CASCADE"), nullable=False)
    product_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("products.id", ondelete="SET NULL"), nullable=True)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    quantity: Mapped[float] = mapped_column(Float, default=1.0)
    unit_of_measure: Mapped[str] = mapped_column(String, nullable=True)
    unit_price: Mapped[float] = mapped_column(Float, default=0.0)
    line_total: Mapped[float] = mapped_column(Float, default=0.0)

    sales_order = relationship("SalesOrder", back_populates="line_items")


# ==========================================
# Phase C: Collaboration (Quotation Messages)
# ==========================================

class QuotationMessage(CoreModel):
    __tablename__ = "quotation_messages"
    
    quotation_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("quotations.id", ondelete="CASCADE"), nullable=False)
    sender_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    content: Mapped[str] = mapped_column(Text, nullable=False)
    attachment_url: Mapped[str] = mapped_column(String, nullable=True)
    attachment_name: Mapped[str] = mapped_column(String, nullable=True)
    
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=True, onupdate=func.now())

    quotation = relationship("Quotation")
    mentions = relationship("QuotationMessageMention", back_populates="message", cascade="all, delete")
    read_receipts = relationship("QuotationMessageReadReceipt", back_populates="message", cascade="all, delete")


class QuotationMessageMention(CoreModel):
    __tablename__ = "quotation_message_mentions"
    
    message_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("quotation_messages.id", ondelete="CASCADE"), nullable=False)
    mentioned_user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    is_read: Mapped[bool] = mapped_column(Boolean, default=False)
    
    message = relationship("QuotationMessage", back_populates="mentions")


class QuotationMessageReadReceipt(CoreModel):
    __tablename__ = "quotation_message_read_receipts"
    
    message_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("quotation_messages.id", ondelete="CASCADE"), nullable=False)
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    read_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    
    message = relationship("QuotationMessage", back_populates="read_receipts")
