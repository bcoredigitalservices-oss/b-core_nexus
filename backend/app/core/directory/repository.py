from typing import List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.core.repository import BaseRepository
from app.core.directory.models import DirectoryProfile, ProfileType

class DirectoryRepository(BaseRepository[DirectoryProfile]):
    def __init__(self, session: AsyncSession):
        super().__init__(DirectoryProfile, session)

    async def list_profiles(self, profile_type: Optional[ProfileType] = None, offset: int = 0, limit: int = 100) -> List[DirectoryProfile]:
        query = select(DirectoryProfile)
        if profile_type:
            query = query.filter(DirectoryProfile.profile_type == profile_type)
        query = query.offset(offset).limit(limit)
        result = await self.session.execute(query)
        return result.scalars().all()
