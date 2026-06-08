import enum
import uuid
from datetime import date, datetime, timezone

from sqlalchemy import (
    Boolean,
    Date,
    DateTime,
    Enum as SAEnum,
    ForeignKey,
    Numeric,
    String,
    Text,
    UUID as SQLUUID,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import CoreModel


# ─── CRM Enums ────────────────────────────────────────────────────────────────

class CustomerLifecycleStatus(str, enum.Enum):
    LEAD            = "LEAD"
    OPPORTUNITY     = "OPPORTUNITY"
    ACTIVE_CUSTOMER = "ACTIVE_CUSTOMER"
    INACTIVE        = "INACTIVE"


class InteractionType(str, enum.Enum):
    CALL    = "CALL"
    EMAIL   = "EMAIL"
    MEETING = "MEETING"
    NOTE    = "NOTE"


class SalesOrderStatus(str, enum.Enum):
    DRAFT     = "DRAFT"
    CONFIRMED = "CONFIRMED"
    FULFILLED = "FULFILLED"
    CANCELLED = "CANCELLED"


class QuotationStatus(str, enum.Enum):
    DRAFT    = "DRAFT"
    SENT     = "SENT"
    ACCEPTED = "ACCEPTED"
    REJECTED = "REJECTED"
    EXPIRED  = "EXPIRED"


class TaskStatus(str, enum.Enum):
    TODO        = "TODO"
    IN_PROGRESS = "IN_PROGRESS"
    DONE        = "DONE"


class TaskPriority(str, enum.Enum):
    LOW    = "LOW"
    MEDIUM = "MEDIUM"
    HIGH   = "HIGH"


# ─── Customer Model ───────────────────────────────────────────────────────────

class Customer(CoreModel):
    """
    Commercial Customer record.
    Represents organizations or individuals tracked within the CRM workspace.
    """
    __tablename__ = "crm_customers"

    company_name: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    contact_name: Mapped[str] = mapped_column(String(255), nullable=False)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    phone: Mapped[str | None] = mapped_column(String(50), nullable=True)
    lifecycle_status: Mapped[CustomerLifecycleStatus] = mapped_column(
        SAEnum(CustomerLifecycleStatus, name="crm_customer_lifecycle_status", create_type=True),
        nullable=False,
        default=CustomerLifecycleStatus.LEAD,
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
        index=True,
    )

    # Relationships
    interaction_logs: Mapped[list["InteractionLog"]] = relationship(
        "InteractionLog",
        back_populates="customer",
        cascade="all, delete-orphan",
    )
    sales_orders: Mapped[list["SalesOrder"]] = relationship(
        "SalesOrder",
        back_populates="customer",
        cascade="all, delete-orphan",
    )
    quotations: Mapped[list["Quotation"]] = relationship(
        "Quotation",
        back_populates="customer",
        cascade="all, delete-orphan",
    )
    contacts: Mapped[list["Contact"]] = relationship(
        "Contact",
        back_populates="customer",
        cascade="all, delete-orphan",
    )


# ─── Contact Model ────────────────────────────────────────────────────────────

class Contact(CoreModel):
    """
    Individual contact person linked to a Customer organization.
    """
    __tablename__ = "crm_contacts"

    customer_id: Mapped[uuid.UUID] = mapped_column(
        SQLUUID(as_uuid=True),
        ForeignKey("crm_customers.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    first_name: Mapped[str] = mapped_column(String(150), nullable=False)
    last_name: Mapped[str] = mapped_column(String(150), nullable=False)
    email: Mapped[str | None] = mapped_column(String(255), nullable=True, index=True)
    phone: Mapped[str | None] = mapped_column(String(50), nullable=True)
    job_title: Mapped[str | None] = mapped_column(String(255), nullable=True)
    is_primary: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
    )

    # Relationships
    customer: Mapped["Customer"] = relationship("Customer", back_populates="contacts")


# ─── InteractionLog Model ─────────────────────────────────────────────────────

class InteractionLog(CoreModel):
    """
    Chronological activity journal detailing touchpoints with Customers.
    """
    __tablename__ = "crm_interaction_logs"

    customer_id: Mapped[uuid.UUID] = mapped_column(
        SQLUUID(as_uuid=True),
        ForeignKey("crm_customers.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    interaction_type: Mapped[InteractionType] = mapped_column(
        SAEnum(InteractionType, name="crm_interaction_type", create_type=True),
        nullable=False,
    )
    summary: Mapped[str] = mapped_column(Text, nullable=False)
    logged_by_user_id: Mapped[uuid.UUID] = mapped_column(
        SQLUUID(as_uuid=True),
        nullable=False,
        index=True,
    )
    timestamp: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
        index=True,
    )

    # Relationships
    customer: Mapped["Customer"] = relationship("Customer", back_populates="interaction_logs")


# ─── Quotation Model ──────────────────────────────────────────────────────────

class Quotation(CoreModel):
    """
    Sales Quotation sent to a Customer before order confirmation.
    """
    __tablename__ = "crm_quotations"

    customer_id: Mapped[uuid.UUID] = mapped_column(
        SQLUUID(as_uuid=True),
        ForeignKey("crm_customers.id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )
    quotation_reference: Mapped[str] = mapped_column(String(100), unique=True, index=True, nullable=False)
    quotation_date: Mapped[date] = mapped_column(Date, nullable=False, index=True)
    expiry_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    status: Mapped[QuotationStatus] = mapped_column(
        SAEnum(QuotationStatus, name="crm_quotation_status", create_type=True),
        nullable=False,
        default=QuotationStatus.DRAFT,
    )
    grand_total: Mapped[float] = mapped_column(Numeric(15, 4), nullable=False, default=0.0)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
    )

    # Relationships
    customer: Mapped["Customer"] = relationship("Customer", back_populates="quotations")
    lines: Mapped[list["QuotationLine"]] = relationship(
        "QuotationLine",
        back_populates="quotation",
        cascade="all, delete-orphan",
    )


class QuotationLine(CoreModel):
    """Individual line items on a Quotation."""
    __tablename__ = "crm_quotation_lines"

    quotation_id: Mapped[uuid.UUID] = mapped_column(
        SQLUUID(as_uuid=True),
        ForeignKey("crm_quotations.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    description: Mapped[str] = mapped_column(String(500), nullable=False)
    quantity: Mapped[float] = mapped_column(Numeric(15, 4), nullable=False)
    unit_price: Mapped[float] = mapped_column(Numeric(15, 4), nullable=False)
    line_total: Mapped[float] = mapped_column(Numeric(15, 4), nullable=False)

    # Relationships
    quotation: Mapped["Quotation"] = relationship("Quotation", back_populates="lines")


# ─── Task / ToDo Model ────────────────────────────────────────────────────────

class CrmTask(CoreModel):
    """
    CRM Task / To-Do item. Can optionally link to a Customer.
    """
    __tablename__ = "crm_tasks"

    title: Mapped[str] = mapped_column(String(500), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    customer_id: Mapped[uuid.UUID | None] = mapped_column(
        SQLUUID(as_uuid=True),
        ForeignKey("crm_customers.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    assigned_user_id: Mapped[uuid.UUID | None] = mapped_column(
        SQLUUID(as_uuid=True),
        nullable=True,
        index=True,
    )
    due_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    status: Mapped[TaskStatus] = mapped_column(
        SAEnum(TaskStatus, name="crm_task_status", create_type=True),
        nullable=False,
        default=TaskStatus.TODO,
    )
    priority: Mapped[TaskPriority] = mapped_column(
        SAEnum(TaskPriority, name="crm_task_priority", create_type=True),
        nullable=False,
        default=TaskPriority.MEDIUM,
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
        index=True,
    )


# ─── SalesOrder Model ─────────────────────────────────────────────────────────

class SalesOrder(CoreModel):
    """
    Sales Order header tracking customer purchase commitments, reference numbers, and status.
    """
    __tablename__ = "crm_sales_orders"

    customer_id: Mapped[uuid.UUID] = mapped_column(
        SQLUUID(as_uuid=True),
        ForeignKey("crm_customers.id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )
    order_reference: Mapped[str] = mapped_column(String(100), unique=True, index=True, nullable=False)
    order_date: Mapped[date] = mapped_column(Date, nullable=False, index=True)
    status: Mapped[SalesOrderStatus] = mapped_column(
        SAEnum(SalesOrderStatus, name="crm_sales_order_status", create_type=True),
        nullable=False,
        default=SalesOrderStatus.DRAFT,
    )
    grand_total: Mapped[float] = mapped_column(Numeric(15, 4), nullable=False, default=0.0)

    # Relationships
    customer: Mapped["Customer"] = relationship("Customer", back_populates="sales_orders")
    lines: Mapped[list["SalesOrderLine"]] = relationship(
        "SalesOrderLine",
        back_populates="sales_order",
        cascade="all, delete-orphan",
    )


# ─── SalesOrderLine Model ─────────────────────────────────────────────────────

class SalesOrderLine(CoreModel):
    """
    Individual items, quantities, and pricing mapped under a Sales Order parent.
    """
    __tablename__ = "crm_sales_order_lines"

    sales_order_id: Mapped[uuid.UUID] = mapped_column(
        SQLUUID(as_uuid=True),
        ForeignKey("crm_sales_orders.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    item_id: Mapped[uuid.UUID] = mapped_column(
        SQLUUID(as_uuid=True),
        ForeignKey("inv_items.id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )
    quantity: Mapped[float] = mapped_column(Numeric(15, 4), nullable=False)
    unit_price: Mapped[float] = mapped_column(Numeric(15, 4), nullable=False)
    line_total: Mapped[float] = mapped_column(Numeric(15, 4), nullable=False)

    # Relationships
    sales_order: Mapped["SalesOrder"] = relationship("SalesOrder", back_populates="lines")
