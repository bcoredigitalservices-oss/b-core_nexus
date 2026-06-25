from pydantic import BaseModel, ConfigDict
from uuid import UUID

from typing import Dict, Any

class InstanceProfileBase(BaseModel):
    organization_name: str
    base_currency: str = "INR"
    timezone: str = "UTC"

class InstanceProfileCreate(InstanceProfileBase):
    pass

class InstanceProfileRead(InstanceProfileBase):
    id: UUID
    is_initialized: bool
    active_modules: Dict[str, Any] = {}

    model_config = ConfigDict(from_attributes=True)
