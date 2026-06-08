from pydantic import BaseModel, Field, field_validator
from typing import Optional
from decimal import Decimal
from datetime import datetime, timezone
from uuid import UUID

class CurrencyBase(BaseModel):
    iso_code: str = Field(..., min_length=3, max_length=3, description="3-letter ISO currency code")
    symbol: str = Field(..., max_length=10)
    is_active: bool = Field(default=True)
    fractional_unit_name: str = Field(..., max_length=50)

    @field_validator("iso_code")
    @classmethod
    def validate_iso_code(cls, v: str) -> str:
        upper_v = v.upper()
        if not upper_v.isalpha():
            raise ValueError("iso_code must only contain alphabetic characters")
        return upper_v

class CurrencyCreate(CurrencyBase):
    pass

class CurrencyRead(CurrencyBase):
    id: UUID

    class Config:
        from_attributes = True

class ExchangeRateBase(BaseModel):
    from_currency_code: str = Field(..., min_length=3, max_length=3)
    to_currency_code: str = Field(..., min_length=3, max_length=3)
    conversion_rate: Decimal = Field(..., gt=Decimal("0"), description="Conversion exchange rate")
    effective_from_date: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    @field_validator("from_currency_code", "to_currency_code")
    @classmethod
    def validate_currency_code(cls, v: str) -> str:
        upper_v = v.upper()
        if not upper_v.isalpha():
            raise ValueError("currency code must only contain alphabetic characters")
        return upper_v

class ExchangeRateCreate(ExchangeRateBase):
    pass

class ExchangeRateRead(ExchangeRateBase):
    id: UUID

    class Config:
        from_attributes = True
