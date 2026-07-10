import uuid
import enum
from datetime import datetime
from sqlalchemy import Column, String, ForeignKey, Text, DateTime, Boolean
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.sql import func

from app.database import CoreModel

class NotificationType(str, enum.Enum):
    TASK_ASSIGNED = "task_assigned"
    MENTION = "mention"

class Notification(CoreModel):
    __tablename__ = "notifications"
    
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    title: Mapped[str] = mapped_column(String, nullable=False)
    message: Mapped[str] = mapped_column(Text, nullable=False)
    notification_type: Mapped[str] = mapped_column(String, nullable=False)
    
    entity_type: Mapped[str] = mapped_column(String, nullable=True) # e.g. "task", "quotation"
    entity_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), nullable=True)
    
    is_read: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
