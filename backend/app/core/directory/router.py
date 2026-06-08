from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from typing import List, Optional
from uuid import UUID
from app.database import get_db
from app.core.auth.router import RoleTierChecker, get_current_user
from app.core.directory.models import DirectoryProfile, ProfileType
from app.core.directory.schemas import DirectoryProfileCreate, DirectoryProfileUpdate, DirectoryProfileResponse

router = APIRouter(prefix="/directory", tags=["Global Directory"])

# Role guards
require_tier_2 = RoleTierChecker(required_tier=2) # Directional or Admin
require_tier_4 = RoleTierChecker(required_tier=4) # Operator or higher (Any authenticated user)

@router.post("", response_model=DirectoryProfileResponse, status_code=status.HTTP_201_CREATED)
async def create_profile(
    profile_in: DirectoryProfileCreate,
    db: AsyncSession = Depends(get_db),
    _ = Depends(require_tier_2)
):
    profile = DirectoryProfile(**profile_in.model_dump())
    db.add(profile)
    await db.commit()
    await db.refresh(profile)
    return profile

@router.get("", response_model=List[DirectoryProfileResponse])
async def list_profiles(
    profile_type: Optional[ProfileType] = None,
    limit: int = Query(default=100, ge=1, le=1000),
    offset: int = Query(default=0, ge=0),
    db: AsyncSession = Depends(get_db),
    _ = Depends(require_tier_4)
):
    query = select(DirectoryProfile)
    if profile_type:
        query = query.filter(DirectoryProfile.profile_type == profile_type)
    
    query = query.offset(offset).limit(limit)
    result = await db.execute(query)
    return result.scalars().all()

@router.get("/{profile_id}", response_model=DirectoryProfileResponse)
async def get_profile(
    profile_id: UUID,
    db: AsyncSession = Depends(get_db),
    _ = Depends(require_tier_4)
):
    result = await db.execute(select(DirectoryProfile).filter(DirectoryProfile.id == profile_id))
    profile = result.scalars().first()
    if not profile:
        raise HTTPException(status_code=404, detail="Directory profile not found")
    return profile

@router.put("/{profile_id}", response_model=DirectoryProfileResponse)
async def update_profile(
    profile_id: UUID,
    profile_in: DirectoryProfileUpdate,
    db: AsyncSession = Depends(get_db),
    _ = Depends(require_tier_2)
):
    result = await db.execute(select(DirectoryProfile).filter(DirectoryProfile.id == profile_id))
    profile = result.scalars().first()
    if not profile:
        raise HTTPException(status_code=404, detail="Directory profile not found")
    
    update_data = profile_in.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(profile, key, value)
        
    await db.commit()
    await db.refresh(profile)
    return profile

@router.delete("/{profile_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_profile(
    profile_id: UUID,
    db: AsyncSession = Depends(get_db),
    _ = Depends(require_tier_2)
):
    result = await db.execute(select(DirectoryProfile).filter(DirectoryProfile.id == profile_id))
    profile = result.scalars().first()
    if not profile:
        raise HTTPException(status_code=404, detail="Directory profile not found")
    
    # Soft delete
    profile.is_active = False
    await db.commit()
    return None
