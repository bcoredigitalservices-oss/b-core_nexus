import uuid
from datetime import datetime, date
from sqlalchemy import Column, String, Boolean, ForeignKey, Enum, Text, Float, DateTime, Integer, UniqueConstraint, Table, Date
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func, text
import enum

from app.database import Base, CoreModel


class LeadType(str, enum.Enum):
    PERSON = "person"
    COMPANY = "company"


class DealPipelineStage(str, enum.Enum):
    DISCOVERY = "discovery"
    MATURE = "mature"
    NEGOTIATION = "negotiation"
    WON = "won"
    LOST = "lost"



class Contact(CoreModel):
    __tablename__ = "contacts"

    owner_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    first_name: Mapped[str] = mapped_column(String, nullable=False)
    last_name: Mapped[str] = mapped_column(String, nullable=True)
    email: Mapped[str] = mapped_column(String, nullable=True)
    phone: Mapped[str] = mapped_column(String, nullable=True)
    job_title: Mapped[str] = mapped_column(String, nullable=True)
    department: Mapped[str] = mapped_column(String, nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())


class Lead(CoreModel):
    __tablename__ = "leads"

    reference_number: Mapped[str] = mapped_column(String, nullable=False, unique=True, server_default=text("'LEAD-' || nextval('lead_seq')"))
    owner_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    title: Mapped[str] = mapped_column(String, nullable=False) # e.g. "Software licensing deal"
    lead_type: Mapped[LeadType] = mapped_column(String, nullable=False) # Enum: person, company
    company_name: Mapped[str] = mapped_column(String, nullable=True)
    pipeline_stage: Mapped[str] = mapped_column(String, default="lead")
    priority: Mapped[str] = mapped_column(String, nullable=True) # Low, Medium, High
    lead_source: Mapped[str] = mapped_column(String, nullable=True)
    is_converted: Mapped[bool] = mapped_column(Boolean, default=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # Relationships
    contacts = relationship("LeadContactLink", back_populates="lead", cascade="all, delete")
    activities = relationship("LeadActivity", back_populates="lead", cascade="all, delete")
    tags = relationship("LeadTag", back_populates="lead", cascade="all, delete")
    attachments = relationship("LeadAttachment", back_populates="lead", cascade="all, delete")
    deals = relationship("Deal", back_populates="lead", cascade="all, delete")


class LeadContactLink(CoreModel):
    __tablename__ = "lead_contact_links"
    
    lead_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("leads.id", ondelete="CASCADE"), nullable=False)
    contact_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("contacts.id", ondelete="CASCADE"), nullable=False)
    role_at_lead: Mapped[str] = mapped_column(String, nullable=True)
    
    lead = relationship("Lead", back_populates="contacts")
    contact = relationship("Contact")


class LeadActivity(CoreModel):
    __tablename__ = "lead_activities"

    lead_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("leads.id", ondelete="CASCADE"), nullable=False)
    created_by_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    activity_type: Mapped[str] = mapped_column(String, nullable=False) # call, email, meeting
    notes: Mapped[str] = mapped_column(Text, nullable=True)
    
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    lead = relationship("Lead", back_populates="activities")


class LeadTag(CoreModel):
    __tablename__ = "lead_tags"
    
    lead_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("leads.id", ondelete="CASCADE"), nullable=False)
    tag_name: Mapped[str] = mapped_column(String, nullable=False)
    
    lead = relationship("Lead", back_populates="tags")


class LeadAttachment(CoreModel):
    __tablename__ = "lead_attachments"

    lead_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("leads.id", ondelete="CASCADE"), nullable=False)
    uploaded_by_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    file_name: Mapped[str] = mapped_column(String, nullable=False)
    file_url: Mapped[str] = mapped_column(String, nullable=False)
    
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    lead = relationship("Lead", back_populates="attachments")


class Customer(CoreModel):
    __tablename__ = "customers"

    reference_number: Mapped[str] = mapped_column(String, nullable=False, unique=True, server_default=text("'CUST-' || nextval('customer_seq')"))
    owner_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    company_name: Mapped[str] = mapped_column(String, nullable=False)
    tax_id: Mapped[str] = mapped_column(String, nullable=True)
    payment_terms: Mapped[str] = mapped_column(String, nullable=True)
    credit_limit: Mapped[float] = mapped_column(Float, nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    addresses = relationship("CustomerAddress", back_populates="customer", cascade="all, delete")
    contacts = relationship("CustomerContactLink", back_populates="customer", cascade="all, delete")
    deals = relationship("Deal", back_populates="customer", cascade="all, delete")


class CustomerAddress(CoreModel):
    __tablename__ = "customer_addresses"

    customer_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("customers.id", ondelete="CASCADE"), nullable=False)
    address_type: Mapped[str] = mapped_column(String, nullable=False) # shipping, billing, project_site
    address_line_1: Mapped[str] = mapped_column(String, nullable=False)
    address_line_2: Mapped[str] = mapped_column(String, nullable=True)
    city: Mapped[str] = mapped_column(String, nullable=True)
    state: Mapped[str] = mapped_column(String, nullable=True)
    country: Mapped[str] = mapped_column(String, nullable=True)
    zip_code: Mapped[str] = mapped_column(String, nullable=True)
    is_default: Mapped[bool] = mapped_column(Boolean, default=False)
    
    customer = relationship("Customer", back_populates="addresses")


class CustomerContactLink(CoreModel):
    __tablename__ = "customer_contact_links"
    
    customer_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("customers.id", ondelete="CASCADE"), nullable=False)
    contact_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("contacts.id", ondelete="CASCADE"), nullable=False)
    role_at_customer: Mapped[str] = mapped_column(String, nullable=True)
    
    customer = relationship("Customer", back_populates="contacts")
    contact = relationship("Contact")


class RecordShare(CoreModel):
    __tablename__ = "record_shares"
    
    entity_type: Mapped[str] = mapped_column(String, nullable=False) # 'lead', 'contact', 'quotation', etc.
    entity_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), nullable=False)
    
    shared_with_user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    shared_by_user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    
    access_level: Mapped[str] = mapped_column(String, nullable=False, default="read") # 'read' or 'write'
    
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    __table_args__ = (
        UniqueConstraint("entity_type", "entity_id", "shared_with_user_id", name="uq_record_share"),
    )


class Deal(CoreModel):
    __tablename__ = "deals"
    
    reference_number: Mapped[str] = mapped_column(String, nullable=False, unique=True, server_default=text("'DEAL-' || nextval('deal_seq')"))
    owner_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    customer_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("customers.id", ondelete="CASCADE"), nullable=True)
    lead_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("leads.id", ondelete="CASCADE"), nullable=True)
    
    deal_name: Mapped[str] = mapped_column(String, nullable=False)
    pipeline_stage: Mapped[str] = mapped_column(String, default=DealPipelineStage.DISCOVERY.value)
    expected_revenue: Mapped[float] = mapped_column(Float, default=0.0)
    close_date: Mapped[date] = mapped_column(Date, nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    customer = relationship("Customer", back_populates="deals")
    lead = relationship("Lead", back_populates="deals")

