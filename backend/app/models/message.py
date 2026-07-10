import uuid
from datetime import datetime
from sqlalchemy import Column, String, ForeignKey, Text, DateTime, Boolean
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func

from app.database import CoreModel

class Message(CoreModel):
    __tablename__ = "messages"
    
    entity_type: Mapped[str] = mapped_column(String, nullable=False) # "lead", "deal", "quotation", etc.
    entity_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), nullable=False)
    
    sender_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    content: Mapped[str] = mapped_column(Text, nullable=False)
    attachment_url: Mapped[str] = mapped_column(String, nullable=True)
    attachment_name: Mapped[str] = mapped_column(String, nullable=True)
    
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=True, onupdate=func.now())

    mentions = relationship("MessageMention", back_populates="message", cascade="all, delete")
    read_receipts = relationship("MessageReadReceipt", back_populates="message", cascade="all, delete")

class MessageMention(CoreModel):
    __tablename__ = "message_mentions"
    
    message_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("messages.id", ondelete="CASCADE"), nullable=False)
    mentioned_user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    is_read: Mapped[bool] = mapped_column(Boolean, default=False)
    
    message = relationship("Message", back_populates="mentions")

class MessageReadReceipt(CoreModel):
    __tablename__ = "message_read_receipts"
    
    message_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("messages.id", ondelete="CASCADE"), nullable=False)
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    read_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    
    message = relationship("Message", back_populates="read_receipts")
