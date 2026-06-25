from pydantic import BaseModel, Field, field_validator
from typing import Dict, Any, Optional
from uuid import UUID

class CatalogItemBase(BaseModel):
    sku: str = Field(..., min_length=1, max_length=100)
    title: str = Field(..., min_length=1, max_length=255)
    custom_attributes: Dict[str, Any] = Field(default_factory=dict)

class CatalogItemCreate(CatalogItemBase):
    pass

class CatalogItemUpdate(BaseModel):
    sku: Optional[str] = None
    title: Optional[str] = None
    is_active: Optional[bool] = None
    custom_attributes: Optional[Dict[str, Any]] = None

class CatalogItemResponse(CatalogItemBase):
    id: UUID
    is_active: bool

    class Config:
        from_attributes = True


class ItemBase(BaseModel):
    sku: str = Field(..., description="Globally unique SKU code")
    barcode: Optional[str] = Field(default=None, description="Unique scanning barcode")
    name: str = Field(..., min_length=1)
    catalog_type: str = Field(..., description="e.g. stock, service, raw_material, fixed_asset")
    default_uom: str = Field(..., description="Unit of Measure (e.g. NOS, KG, BOX)")
    tax_category_id: Optional[UUID] = None
    item_group_id: Optional[UUID] = None

    @field_validator("sku")
    @classmethod
    def validate_sku(cls, v: str) -> str:
        if not v:
            raise ValueError("SKU cannot be empty")
        return v.strip().upper()

class ItemCreate(ItemBase):
    pass

class ItemUpdate(BaseModel):
    sku: Optional[str] = None
    barcode: Optional[str] = None
    name: Optional[str] = None
    catalog_type: Optional[str] = None
    default_uom: Optional[str] = None
    tax_category_id: Optional[UUID] = None
    item_group_id: Optional[UUID] = None

    @field_validator("sku")
    @classmethod
    def validate_sku(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return v
        if not v:
            raise ValueError("SKU cannot be empty")
        return v.strip().upper()

class ItemRead(ItemBase):
    id: UUID

    class Config:
        from_attributes = True


class ItemGroupBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    parent_id: Optional[UUID] = None
    custom_attributes: Dict[str, Any] = Field(default_factory=dict)

class ItemGroupCreate(ItemGroupBase):
    pass

class ItemGroupResponse(ItemGroupBase):
    id: UUID

    class Config:
        from_attributes = True

