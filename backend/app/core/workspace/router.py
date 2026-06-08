import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.database import get_db
from app.core.auth.router import get_current_user
from app.core.auth.models import User
from app.models.organization import Organization

router = APIRouter(prefix="/workspace", tags=["Workspace Settings"])

@router.get("/config")
async def get_workspace_config(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Fetch the first organization profile (single-instance setup)
    result = await db.execute(select(Organization))
    org = result.scalars().first()
    
    # Bootstrap organization if not yet initialized
    if not org:
        org = Organization(
            name="B-Core Nexus Org",
            industry_vertical="GENERAL_TRADING"
        )
        db.add(org)
        await db.flush()

    # Update access tracking state atomically
    org.access_count += 1
    org.last_accessed_at = datetime.datetime.now(datetime.timezone.utc)
    
    db.add(org)
    await db.flush()  # Perform an atomic flush to database transaction
    await db.commit()

    # Define vertical-specific workspace configurations
    vertical = org.industry_vertical
    features = {}

    if vertical == "HEALTHCARE_LOGISTICS":
        features = {
            "medicines": {
                "uom_options": ["vials", "mg", "batches"],
                "schema": {
                    "fields": [
                        {"name": "batch_number", "type": "string", "required": True},
                        {"name": "expiry_date", "type": "date", "required": True},
                        {"name": "temperature_controlled", "type": "boolean", "default": False}
                    ]
                }
            },
            "routing": {
                "enabled": True,
                "type": "cold_chain"
            }
        }
    elif vertical == "HEAVY_MACHINERY":
        features = {
            "vehicles": {
                "uom_options": ["hours", "km"],
                "schema": {
                    "fields": [
                        {"name": "vin", "type": "string", "required": True},
                        {"name": "engine_hours", "type": "number", "required": True},
                        {"name": "last_service_date", "type": "date", "required": False}
                    ]
                }
            },
            "maintenance_logs": {
                "enabled": True,
                "type": "preventative"
            }
        }
    else:  # GENERAL_TRADING or other
        features = {
            "general": {
                "enabled": True,
                "uom_options": ["units", "kg", "boxes"],
                "schema": {
                    "fields": [
                        {"name": "sku", "type": "string", "required": True},
                        {"name": "description", "type": "string", "required": False}
                    ]
                }
            }
        }

    return {
        "organization_name": org.name,
        "industry_vertical": vertical,
        "access_count": org.access_count,
        "last_accessed_at": org.last_accessed_at,
        "features": features
    }


@router.get("/config/item-schema")
async def get_item_schema(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    result = await db.execute(select(Organization))
    org = result.scalars().first()
    
    vertical = org.industry_vertical if org else "GENERAL"
    if vertical == "HEAVY_MACHINERY":
        return [
            {"name": "chassis_number", "type": "text"},
            {"name": "power_type", "type": "select", "options": ["Electric", "Diesel"]}
        ]
    return []

