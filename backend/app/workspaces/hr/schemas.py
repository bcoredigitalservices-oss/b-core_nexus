import uuid
from datetime import datetime
from typing import Optional, Dict, Any
from pydantic import BaseModel, Field

class HRBaseEntityBase(BaseModel):
    custom_attributes: Optional[Dict[str, Any]] = Field(default_factory=dict)

class HRBaseEntityCreate(HRBaseEntityBase):
    pass

class HRBaseEntityUpdate(HRBaseEntityBase):
    pass

class HRBaseEntityRead(HRBaseEntityBase):
    id: uuid.UUID
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
