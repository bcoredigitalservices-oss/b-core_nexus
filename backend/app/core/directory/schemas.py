from pydantic import BaseModel, Field
from typing import Dict, Any, Optional
from uuid import UUID
from app.core.directory.models import ProfileType

class DirectoryProfileBase(BaseModel):
    profile_type: ProfileType
    name: str = Field(..., min_length=1, max_length=255)
    email: Optional[str] = None
    phone: Optional[str] = None
    custom_attributes: Dict[str, Any] = Field(default_factory=dict)

class DirectoryProfileCreate(DirectoryProfileBase):
    pass

class DirectoryProfileUpdate(BaseModel):
    profile_type: Optional[ProfileType] = None
    name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    is_active: Optional[bool] = None
    custom_attributes: Optional[Dict[str, Any]] = None

class DirectoryProfileResponse(DirectoryProfileBase):
    id: UUID
    is_active: bool

    class Config:
        from_attributes = True


from typing import Literal

class EntityBase(BaseModel):
    legal_name: str = Field(..., min_length=1)
    trade_name: Optional[str] = None
    entity_type: Literal['customer', 'vendor', 'branch', 'warehouse', 'subsidiary']
    tax_identifier: Optional[str] = None
    primary_billing_address: Optional[Dict[str, Any]] = None
    primary_shipping_address: Optional[Dict[str, Any]] = None
    is_active: bool = True

class EntityCreate(EntityBase):
    pass

class EntityUpdate(BaseModel):
    legal_name: Optional[str] = None
    trade_name: Optional[str] = None
    entity_type: Optional[Literal['customer', 'vendor', 'branch', 'warehouse', 'subsidiary']] = None
    tax_identifier: Optional[str] = None
    primary_billing_address: Optional[Dict[str, Any]] = None
    primary_shipping_address: Optional[Dict[str, Any]] = None
    is_active: Optional[bool] = None

class EntityRead(EntityBase):
    id: UUID

    class Config:
        from_attributes = True

