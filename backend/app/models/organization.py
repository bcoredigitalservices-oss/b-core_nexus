import datetime
import uuid
from sqlalchemy import String, Integer, DateTime, ForeignKey, Column
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship, backref
from app.database import CoreModel

class Organization(CoreModel):
    __tablename__ = "organizations"

    name: Mapped[str] = mapped_column(String, nullable=False, default="B-Core Nexus Org")
    legal_name: Mapped[str] = mapped_column(String, nullable=False, default="B-Core Nexus Org")
    tax_id: Mapped[str | None] = mapped_column(String, nullable=True)
    primary_email: Mapped[str | None] = mapped_column(String, nullable=True)
    contact_phone: Mapped[str | None] = mapped_column(String, nullable=True)
    base_currency: Mapped[str] = mapped_column(String, nullable=False, default="USD")
    
    # Strictly typed industry vertical column
    # Valid options: "HEALTHCARE_LOGISTICS", "HEAVY_MACHINERY", "GENERAL", "GENERAL_TRADING"
    industry_vertical: Mapped[str] = mapped_column(
        String, 
        nullable=False, 
        default="GENERAL_TRADING"
    )
    
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
    members: Mapped[list["User"]] = relationship(
        "User", 
        foreign_keys="[User.department_id]", 
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

