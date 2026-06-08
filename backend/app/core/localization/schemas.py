from pydantic import BaseModel, Field, field_validator
from typing import Optional
from uuid import UUID

class SystemSettingsBase(BaseModel):
    organization_name: str
    base_currency: str = Field(..., min_length=3, max_length=3, description="3-letter ISO currency code")
    default_timezone: str = Field(default="UTC")
    fiscal_year_start_month: int = Field(default=1, ge=1, le=12)
    date_format: str = Field(default="YYYY-MM-DD")

    @field_validator("base_currency")
    @classmethod
    def validate_base_currency(cls, v: str) -> str:
        upper_v = v.upper()
        if not upper_v.isalpha():
            raise ValueError("base_currency must only contain alphabetic characters")
        return upper_v

class SystemSettingsUpdate(BaseModel):
    organization_name: Optional[str] = None
    base_currency: Optional[str] = Field(None, min_length=3, max_length=3, description="3-letter ISO currency code")
    default_timezone: Optional[str] = None
    fiscal_year_start_month: Optional[int] = Field(None, ge=1, le=12)
    date_format: Optional[str] = None

    @field_validator("base_currency")
    @classmethod
    def validate_base_currency(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return v
        upper_v = v.upper()
        if not upper_v.isalpha():
            raise ValueError("base_currency must only contain alphabetic characters")
        return upper_v

class SystemSettingsRead(SystemSettingsBase):
    id: UUID

    class Config:
        from_attributes = True
