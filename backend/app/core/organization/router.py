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
    legal_name: str = Field(..., min_length=1, max_length=255)
    tax_id: str | None = Field(default=None, max_length=100)
    primary_email: str | None = Field(default=None, max_length=255)
    contact_phone: str | None = Field(default=None, max_length=50)
    base_currency: str = Field(..., min_length=3, max_length=10)
    industry_vertical: IndustryVerticalEnum

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
            name="B-Core Nexus Org",
            legal_name="B-Core Nexus Org",
            base_currency="USD",
            industry_vertical="GENERAL_TRADING"
        )
        db.add(org)
        await db.flush()
        await db.commit()
        await db.refresh(org)
        
    return {
        "legal_name": org.legal_name,
        "tax_id": org.tax_id,
        "primary_email": org.primary_email,
        "contact_phone": org.contact_phone,
        "base_currency": org.base_currency,
        "industry_vertical": org.industry_vertical
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
    
    # Update fields
    org.name = payload.legal_name
    org.legal_name = payload.legal_name
    org.tax_id = payload.tax_id
    org.primary_email = payload.primary_email
    org.contact_phone = payload.contact_phone
    org.base_currency = payload.base_currency
    
    # Map GENERAL / GENERAL_TRADING consistently
    vertical_str = payload.industry_vertical.value
    if vertical_str == "GENERAL":
        vertical_str = "GENERAL_TRADING"
    org.industry_vertical = vertical_str
    
    db.add(org)
    await db.flush()  # Perform atomic flush to db transaction
    await db.commit()
    await db.refresh(org)
    
    return {
        "status": "success",
        "organization": {
            "legal_name": org.legal_name,
            "tax_id": org.tax_id,
            "primary_email": org.primary_email,
            "contact_phone": org.contact_phone,
            "base_currency": org.base_currency,
            "industry_vertical": org.industry_vertical
        }
    }
