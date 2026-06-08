import uuid
from sqlalchemy import Column, String, DateTime, ForeignKey, Index, func
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
from app.database import Base

class EventLog(Base):
    __tablename__ = "event_logs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    entity_id = Column(UUID(as_uuid=True), nullable=False, index=True)
    entity_type = Column(String, nullable=False, index=True)  # e.g., 'customer', 'asset', 'catalog_item'
    event_type = Column(String, nullable=False, index=True)    # e.g., 'message', 'blocker_beacon', 'status_change'
    payload = Column(JSONB, default=dict, nullable=False)
    created_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    # Relationship to user
    creator = relationship("User")

# GIN Index for rapid search/filtering across event log payload attributes
Index("idx_event_logs_payload", EventLog.payload, postgresql_using="gin")
