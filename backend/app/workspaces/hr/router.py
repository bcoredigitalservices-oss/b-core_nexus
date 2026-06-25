from typing import List
from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

# Placeholder for database dependency injection
async def get_db():
    yield None

from .schemas import HRBaseEntityRead, HRBaseEntityCreate
from .service import hr_service

router = APIRouter(prefix="/api/v1/hr", tags=["hr"])

@router.get("/health")
async def health_check():
    return {"status": "ok", "workspace": "hr"}

@router.get("/", response_model=List[HRBaseEntityRead])
async def list_entities(skip: int = 0, limit: int = 100, db: AsyncSession = Depends(get_db)):
    return await hr_service.get_all(db=db, skip=skip, limit=limit)

@router.post("/", response_model=HRBaseEntityRead, status_code=status.HTTP_201_CREATED)
async def create_entity(entity_in: HRBaseEntityCreate, db: AsyncSession = Depends(get_db)):
    return await hr_service.create(db=db, obj_in=entity_in)

@router.get("/payroll")
async def get_payroll_records():
    # Empty business logic purely for frontend wiring verification
    return []
