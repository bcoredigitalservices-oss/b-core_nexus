import uuid
from typing import List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from .models import HRBaseEntity
from .schemas import HRBaseEntityCreate, HRBaseEntityUpdate

class HRService:
    async def get_all(self, db: AsyncSession, skip: int = 0, limit: int = 100) -> List[HRBaseEntity]:
        result = await db.execute(select(HRBaseEntity).offset(skip).limit(limit))
        return result.scalars().all()

    async def get_by_id(self, db: AsyncSession, entity_id: uuid.UUID) -> Optional[HRBaseEntity]:
        result = await db.execute(select(HRBaseEntity).filter(HRBaseEntity.id == entity_id))
        return result.scalar_one_or_none()

    async def create(self, db: AsyncSession, obj_in: HRBaseEntityCreate) -> HRBaseEntity:
        db_obj = HRBaseEntity(**obj_in.model_dump())
        db.add(db_obj)
        
        # Respecting transaction integrity rules
        await db.flush()
        await db.commit()
        await db.refresh(db_obj)
        return db_obj

    async def update(self, db: AsyncSession, entity_id: uuid.UUID, obj_in: HRBaseEntityUpdate) -> Optional[HRBaseEntity]:
        db_obj = await self.get_by_id(db, entity_id)
        if not db_obj:
            return None
        
        update_data = obj_in.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(db_obj, field, value)
            
        await db.flush()
        await db.commit()
        await db.refresh(db_obj)
        return db_obj

    async def delete(self, db: AsyncSession, entity_id: uuid.UUID) -> bool:
        db_obj = await self.get_by_id(db, entity_id)
        if not db_obj:
            return False
        
        await db.delete(db_obj)
        await db.flush()
        await db.commit()
        return True

hr_service = HRService()
