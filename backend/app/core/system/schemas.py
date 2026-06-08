from pydantic import BaseModel, ConfigDict
from uuid import UUID

class InstanceProfileBase(BaseModel):
    organization_name: str
    base_currency: str = "INR"
    timezone: str = "UTC"

class InstanceProfileCreate(InstanceProfileBase):
    pass

class InstanceProfileRead(InstanceProfileBase):
    id: UUID
    is_initialized: bool

    model_config = ConfigDict(from_attributes=True)
