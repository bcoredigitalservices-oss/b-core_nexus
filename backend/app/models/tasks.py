import uuid
from datetime import datetime, date
from sqlalchemy import Column, String, Boolean, ForeignKey, Text, DateTime, Date, Enum as SQLEnum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func
import enum

from app.database import CoreModel

class TaskStatus(str, enum.Enum):
    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    CANCELLED = "cancelled"

class TaskPriority(str, enum.Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"

class Task(CoreModel):
    __tablename__ = "tasks"
    
    title: Mapped[str] = mapped_column(String, nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=True)
    
    status: Mapped[str] = mapped_column(String, default=TaskStatus.PENDING.value)
    priority: Mapped[str] = mapped_column(String, default=TaskPriority.MEDIUM.value)
    
    due_date: Mapped[date] = mapped_column(Date, nullable=True)
    
    # Polymorphic link to related entity
    entity_type: Mapped[str] = mapped_column(String, nullable=True) # e.g., 'lead', 'quotation', 'customer'
    entity_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), nullable=True)
    
    owner_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    created_by_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
