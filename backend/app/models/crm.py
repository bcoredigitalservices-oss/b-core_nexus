import uuid
from datetime import datetime
from sqlalchemy import Column, String, Boolean, ForeignKey, Enum, Text, Float, DateTime, Integer, UniqueConstraint, Table
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func
import enum

from app.database import Base, CoreModel


class LeadType(str, enum.Enum):
    PERSON = "person"
    COMPANY = "company"


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
