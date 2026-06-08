from pydantic import BaseModel, Field
from typing import Optional
from decimal import Decimal
from datetime import datetime
from uuid import UUID

class TaxRegionBase(BaseModel):
    region_name: str = Field(..., description="Unique region name (e.g. US - California)")

class TaxRegionCreate(TaxRegionBase):
    pass

class TaxRegionRead(TaxRegionBase):
    id: UUID

    class Config:
        from_attributes = True

class TaxCategoryBase(BaseModel):
    category_name: str = Field(..., description="Unique tax category name (e.g. Luxury Tax)")

class TaxCategoryCreate(TaxCategoryBase):
    pass

class TaxCategoryRead(TaxCategoryBase):
    id: UUID

    class Config:
        from_attributes = True

class TaxRuleBase(BaseModel):
    region_id: UUID
    category_id: UUID
    tax_rate_percent: Decimal = Field(..., ge=Decimal("0"), le=Decimal("100"), description="Tax percentage rate")
    effective_from: datetime = Field(..., description="Start of date-effective rule")
    effective_to: Optional[datetime] = Field(default=None, description="End of date-effective rule")

class TaxRuleCreate(TaxRuleBase):
    pass

class TaxRuleRead(TaxRuleBase):
    id: UUID

    class Config:
        from_attributes = True
