import datetime
import uuid
from sqlalchemy import String, Integer, DateTime, ForeignKey, Column, Date, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship, backref
from app.database import CoreModel

class Organization(CoreModel):
    __tablename__ = "organizations"

    # General Profile
    company_name: Mapped[str] = mapped_column(String(255), nullable=False, default="B-Core Nexus Org")
    trading_name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    registration_date: Mapped[datetime.date | None] = mapped_column(Date, nullable=True)
    primary_industry: Mapped[str | None] = mapped_column(String(100), nullable=True, default="GENERAL_TRADING")
    logo_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    favicon_url: Mapped[str | None] = mapped_column(String(500), nullable=True)

    # Legal & Contact
    cin_number: Mapped[str | None] = mapped_column(String(100), nullable=True)
    tax_id: Mapped[str | None] = mapped_column(String(100), nullable=True)
    official_email: Mapped[str | None] = mapped_column(String(255), nullable=True)
    phone_number: Mapped[str | None] = mapped_column(String(50), nullable=True)
    street_address: Mapped[str | None] = mapped_column(Text, nullable=True)
    city: Mapped[str | None] = mapped_column(String(100), nullable=True)
    state_province: Mapped[str | None] = mapped_column(String(100), nullable=True)
    country: Mapped[str | None] = mapped_column(String(100), nullable=True)
    zip_code: Mapped[str | None] = mapped_column(String(20), nullable=True)

    # System & Financial
    base_currency: Mapped[str] = mapped_column(String(3), nullable=False, default="USD")
    date_format: Mapped[str | None] = mapped_column(String(20), nullable=True)
    fiscal_year_start: Mapped[str | None] = mapped_column(String(50), nullable=True)
    number_format: Mapped[str | None] = mapped_column(String(20), nullable=True)
    timezone: Mapped[str | None] = mapped_column(String(100), nullable=True)

    # Operational Defaults
    default_bank_account_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), nullable=True)
    default_dispatch_warehouse_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), nullable=True)
    default_receiving_warehouse_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), nullable=True)
    standard_terms: Mapped[str | None] = mapped_column(Text, nullable=True)
    
    # State tracking properties for atomic flush checks
    access_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    last_accessed_at: Mapped[datetime.datetime | None] = mapped_column(
        DateTime(timezone=True), 
        nullable=True
    )

class Department(CoreModel):
    __tablename__ = "departments"

    id = CoreModel.id

    organization_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False)
    name: Mapped[str] = mapped_column(String, nullable=False)
    description: Mapped[str | None] = mapped_column(String, nullable=True)
    manager_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("users.id", ondelete="SET NULL", use_alter=True, name="fk_departments_manager_id_users"), nullable=True)

    # Self-referential parent_id column
    parent_id = Column(UUID(as_uuid=True), ForeignKey('departments.id', ondelete='CASCADE'), nullable=True)

    # Relationships
    members: Mapped[list["EmployeeProfile"]] = relationship(
        "EmployeeProfile", 
        foreign_keys="[EmployeeProfile.department_id]", 
        back_populates="department"
    )
    manager: Mapped["User | None"] = relationship(
        "User", 
        foreign_keys=[manager_id],
        post_update=True
    )

    # Self-referential children relationship tracking child departments
    children = relationship("Department", backref=backref('parent', remote_side=[id]))

# Pydantic schemas for serialization
from pydantic import BaseModel
from typing import Optional

class DepartmentOut(BaseModel):
    id: uuid.UUID
    name: str
    description: Optional[str] = None
    manager_id: Optional[uuid.UUID] = None
    manager_email: Optional[str] = None
    parent_id: Optional[uuid.UUID] = None
    parent_name: Optional[str] = None
    organization_id: uuid.UUID
    status: str = "active"

    class Config:
        from_attributes = True
        orm_mode = True

