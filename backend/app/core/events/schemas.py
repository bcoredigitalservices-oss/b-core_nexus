from pydantic import BaseModel, Field
from typing import Dict, Any
from uuid import UUID
from datetime import datetime

class EventLogBase(BaseModel):
    entity_id: UUID
    entity_type: str = Field(..., min_length=1, max_length=100)
    event_type: str = Field(..., min_length=1, max_length=100)
    payload: Dict[str, Any] = Field(default_factory=dict)

class EventLogCreate(EventLogBase):
    pass

class EventLogResponse(EventLogBase):
    id: UUID
    created_by: UUID
    created_at: datetime

    class Config:
        from_attributes = True
