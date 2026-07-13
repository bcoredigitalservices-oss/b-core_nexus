import uuid
import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from pydantic import BaseModel, Field
from enum import Enum

from app.database import get_db
from app.core.auth.router import get_current_user
from app.core.auth.models import User
from app.models.organization import Organization

router = APIRouter(prefix="/organization", tags=["Organization Management"])

class IndustryVerticalEnum(str, Enum):
    HEALTHCARE_LOGISTICS = "HEALTHCARE_LOGISTICS"
    HEAVY_MACHINERY = "HEAVY_MACHINERY"
    GENERAL = "GENERAL"
    GENERAL_TRADING = "GENERAL_TRADING"

class OrganizationProfileUpdate(BaseModel):
    # Old frontend compatible fields
    legal_name: str | None = Field(default=None, min_length=1, max_length=255)
    tax_id: str | None = Field(default=None, max_length=100)
    primary_email: str | None = Field(default=None, max_length=255)
    contact_phone: str | None = Field(default=None, max_length=50)
    base_currency: str | None = Field(default=None, min_length=3, max_length=10)
    industry_vertical: IndustryVerticalEnum | None = None
    
    # New backend fields
    company_name: str | None = Field(default=None, min_length=1, max_length=255)
    trading_name: str | None = Field(default=None, max_length=255)
    registration_date: datetime.date | None = None
    primary_industry: str | None = Field(default=None, max_length=100)
    logo_url: str | None = Field(default=None, max_length=500)
    favicon_url: str | None = Field(default=None, max_length=500)
    cin_number: str | None = Field(default=None, max_length=100)
    official_email: str | None = Field(default=None, max_length=255)
    phone_number: str | None = Field(default=None, max_length=50)
    street_address: str | None = None
    city: str | None = Field(default=None, max_length=100)
    state_province: str | None = Field(default=None, max_length=100)
    country: str | None = Field(default=None, max_length=100)
    zip_code: str | None = Field(default=None, max_length=20)
    date_format: str | None = Field(default=None, max_length=20)
    fiscal_year_start: str | None = Field(default=None, max_length=50)
    number_format: str | None = Field(default=None, max_length=20)
    timezone: str | None = Field(default=None, max_length=100)
    default_bank_account_id: uuid.UUID | None = None
    default_dispatch_warehouse_id: uuid.UUID | None = None
    default_receiving_warehouse_id: uuid.UUID | None = None
    standard_terms: str | None = None

@router.get("/profile")
async def get_organization_profile(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Fetch first organization
    result = await db.execute(select(Organization))
    org = result.scalars().first()
    
    if not org:
        org = Organization(
            company_name="B-Core Nexus Org",
            base_currency="USD",
            primary_industry="GENERAL_TRADING"
        )
        db.add(org)
        await db.flush()
        await db.commit()
        await db.refresh(org)
        
    return {
        # Old fields mapped for frontend compatibility
        "legal_name": org.company_name,
        "tax_id": org.tax_id,
        "primary_email": org.official_email,
        "contact_phone": org.phone_number,
        "base_currency": org.base_currency,
        "industry_vertical": org.primary_industry,
        
        # New backend fields
        "company_name": org.company_name,
        "trading_name": org.trading_name,
        "registration_date": org.registration_date,
        "primary_industry": org.primary_industry,
        "logo_url": org.logo_url,
        "favicon_url": org.favicon_url,
        "cin_number": org.cin_number,
        "official_email": org.official_email,
        "phone_number": org.phone_number,
        "street_address": org.street_address,
        "city": org.city,
        "state_province": org.state_province,
        "country": org.country,
        "zip_code": org.zip_code,
        "date_format": org.date_format,
        "fiscal_year_start": org.fiscal_year_start,
        "number_format": org.number_format,
        "timezone": org.timezone,
        "default_bank_account_id": org.default_bank_account_id,
        "default_dispatch_warehouse_id": org.default_dispatch_warehouse_id,
        "default_receiving_warehouse_id": org.default_receiving_warehouse_id,
        "standard_terms": org.standard_terms,
    }

@router.put("/profile")
async def update_organization_profile(
    payload: OrganizationProfileUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Fetch first organization
    result = await db.execute(select(Organization))
    org = result.scalars().first()
    
    if not org:
        org = Organization()
        db.add(org)
    
    # Update fields with fallback mappings from old to new
    if payload.company_name or payload.legal_name:
        org.company_name = payload.company_name or payload.legal_name or org.company_name
    if payload.tax_id is not None:
        org.tax_id = payload.tax_id
    if payload.official_email or payload.primary_email:
        org.official_email = payload.official_email or payload.primary_email or org.official_email
    if payload.phone_number or payload.contact_phone:
        org.phone_number = payload.phone_number or payload.contact_phone or org.phone_number
    if payload.base_currency is not None:
        org.base_currency = payload.base_currency
    
    # Handle industry vertical / primary industry mapping
    industry = payload.primary_industry
    if not industry and payload.industry_vertical:
        industry = payload.industry_vertical.value
    if industry == "GENERAL":
        industry = "GENERAL_TRADING"
    if industry:
        org.primary_industry = industry

    # New fields
    if payload.trading_name is not None: org.trading_name = payload.trading_name
    if payload.registration_date is not None: org.registration_date = payload.registration_date
    if payload.logo_url is not None: org.logo_url = payload.logo_url
    if payload.favicon_url is not None: org.favicon_url = payload.favicon_url
    if payload.cin_number is not None: org.cin_number = payload.cin_number
    if payload.street_address is not None: org.street_address = payload.street_address
    if payload.city is not None: org.city = payload.city
    if payload.state_province is not None: org.state_province = payload.state_province
    if payload.country is not None: org.country = payload.country
    if payload.zip_code is not None: org.zip_code = payload.zip_code
    if payload.date_format is not None: org.date_format = payload.date_format
    if payload.fiscal_year_start is not None: org.fiscal_year_start = payload.fiscal_year_start
    if payload.number_format is not None: org.number_format = payload.number_format
    if payload.timezone is not None: org.timezone = payload.timezone
    if payload.default_bank_account_id is not None: org.default_bank_account_id = payload.default_bank_account_id
    if payload.default_dispatch_warehouse_id is not None: org.default_dispatch_warehouse_id = payload.default_dispatch_warehouse_id
    if payload.default_receiving_warehouse_id is not None: org.default_receiving_warehouse_id = payload.default_receiving_warehouse_id
    if payload.standard_terms is not None: org.standard_terms = payload.standard_terms
    
    db.add(org)
    await db.flush()  # Perform atomic flush to db transaction
    await db.commit()
    await db.refresh(org)
    
    return {
        "status": "success",
        "organization": {
            "legal_name": org.company_name,
            "tax_id": org.tax_id,
            "primary_email": org.official_email,
            "contact_phone": org.phone_number,
            "base_currency": org.base_currency,
            "industry_vertical": org.primary_industry,
            "company_name": org.company_name,
            "trading_name": org.trading_name,
            "registration_date": org.registration_date,
            "primary_industry": org.primary_industry,
            "logo_url": org.logo_url,
            "favicon_url": org.favicon_url,
            "cin_number": org.cin_number,
            "official_email": org.official_email,
            "phone_number": org.phone_number,
            "street_address": org.street_address,
            "city": org.city,
            "state_province": org.state_province,
            "country": org.country,
            "zip_code": org.zip_code,
            "date_format": org.date_format,
            "fiscal_year_start": org.fiscal_year_start,
            "number_format": org.number_format,
            "timezone": org.timezone,
            "default_bank_account_id": org.default_bank_account_id,
            "default_dispatch_warehouse_id": org.default_dispatch_warehouse_id,
            "default_receiving_warehouse_id": org.default_receiving_warehouse_id,
            "standard_terms": org.standard_terms,
        }
    }
