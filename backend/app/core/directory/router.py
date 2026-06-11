from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Optional
from uuid import UUID
from app.database import get_db
from app.core.auth.router import RoleTierChecker, get_current_user
from app.core.directory.models import DirectoryProfile, ProfileType
from app.core.directory.schemas import DirectoryProfileCreate, DirectoryProfileUpdate, DirectoryProfileResponse
from app.core.directory.repository import DirectoryRepository

router = APIRouter(prefix="/directory", tags=["Global Directory"])

# Role guards
require_tier_2 = RoleTierChecker(required_tier=2) # Directional or Admin
require_tier_4 = RoleTierChecker(required_tier=4) # Operator or higher (Any authenticated user)

def get_directory_repo(db: AsyncSession = Depends(get_db)) -> DirectoryRepository:
    return DirectoryRepository(db)

@router.post("", response_model=DirectoryProfileResponse, status_code=status.HTTP_201_CREATED)
async def create_profile(
    profile_in: DirectoryProfileCreate,
    repo: DirectoryRepository = Depends(get_directory_repo),
    _ = Depends(require_tier_2)
):
    profile = DirectoryProfile(**profile_in.model_dump())
    # Database integrity errors are now caught and raised as DataIntegrityError by the repo
    created_profile = await repo.create(profile)
    
    # Broadcast the event for EDA decoupled workspaces
    from app.core.events.bus import internal_bus
    await internal_bus.publish("DirectoryProfileCreated", created_profile)
    
    return created_profile

@router.get("", response_model=List[DirectoryProfileResponse])
async def list_profiles(
    profile_type: Optional[ProfileType] = None,
    limit: int = Query(default=100, ge=1, le=1000),
    offset: int = Query(default=0, ge=0),
    repo: DirectoryRepository = Depends(get_directory_repo),
    _ = Depends(require_tier_4)
):
    return await repo.list_profiles(profile_type=profile_type, offset=offset, limit=limit)

@router.get("/{profile_id}", response_model=DirectoryProfileResponse)
async def get_profile(
    profile_id: UUID,
    repo: DirectoryRepository = Depends(get_directory_repo),
    _ = Depends(require_tier_4)
):
    # This automatically raises ResourceNotFoundError (404-mapped via global handler or base exception)
    # wait, we need to map ResourceNotFoundError to 404 in FastAPI if not already mapped, 
    # but CoreERPException is mapped to its status_code in main.py! So it works automatically!
    return await repo.get_by_id(profile_id)

@router.put("/{profile_id}", response_model=DirectoryProfileResponse)
async def update_profile(
    profile_id: UUID,
    profile_in: DirectoryProfileUpdate,
    repo: DirectoryRepository = Depends(get_directory_repo),
    _ = Depends(require_tier_2)
):
    profile = await repo.get_by_id(profile_id)
    update_data = profile_in.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(profile, key, value)
    
    return await repo.update(profile)

@router.delete("/{profile_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_profile(
    profile_id: UUID,
    repo: DirectoryRepository = Depends(get_directory_repo),
    _ = Depends(require_tier_2)
):
    profile = await repo.get_by_id(profile_id)
    # Soft delete instead of hard delete, so we use update()
    profile.is_active = False
    await repo.update(profile)
    return None
