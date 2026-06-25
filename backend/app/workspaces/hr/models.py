import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, DateTime
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import declarative_base

# In a real app this might be imported from a core module, e.g., from app.db.base_class import Base
Base = declarative_base()

class HRBaseEntity(Base):
    __tablename__ = "hr_base_entity"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at = Column(
        DateTime(timezone=True), 
        default=lambda: datetime.now(timezone.utc), 
        onupdate=lambda: datetime.now(timezone.utc)
    )
    custom_attributes = Column(JSONB, default=dict)
