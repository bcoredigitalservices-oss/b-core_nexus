from typing import TypeVar, Generic, Type, Optional, Any
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.exc import IntegrityError, SQLAlchemyError
from sqlalchemy.future import select

from app.core.exceptions import DataIntegrityError, ResourceNotFoundError

# T represents the SQLAlchemy Model type
T = TypeVar("T")

class BaseRepository(Generic[T]):
    """
    Base Repository Pattern Implementation.
    This class wraps all direct SQLAlchemy database interactions.
    It catches underlying database driver exceptions (like IntegrityError) 
    and translates them into pure Domain Exceptions, enforcing DDD principles.
    """
    
    def __init__(self, model: Type[T], session: AsyncSession):
        self.model = model
        self.session = session

    async def get_by_id(self, record_id: Any) -> T:
        """Fetch a record by its primary key ID, raising ResourceNotFoundError if missing."""
        result = await self.session.execute(select(self.model).filter(self.model.id == record_id))
        obj = result.scalars().first()
        if not obj:
            raise ResourceNotFoundError(message=f"{self.model.__name__} with ID {record_id} not found.")
        return obj

    async def get_optional(self, record_id: Any) -> Optional[T]:
        """Fetch a record by ID, returning None if missing instead of an exception."""
        result = await self.session.execute(select(self.model).filter(self.model.id == record_id))
        return result.scalars().first()

    async def create(self, obj_in: T) -> T:
        """Persist a new model instance to the database."""
        self.session.add(obj_in)
        try:
            await self.session.commit()
            await self.session.refresh(obj_in)
            return obj_in
        except IntegrityError as e:
            await self.session.rollback()
            # The .orig attribute typically contains the specific driver message (like unique constraint violation)
            raise DataIntegrityError(message=f"Database integrity conflict creating {self.model.__name__}: {str(e.orig)}")
        except SQLAlchemyError as e:
            await self.session.rollback()
            raise e

    async def update(self, obj: T) -> T:
        """Commit updates to an existing model instance."""
        try:
            await self.session.commit()
            await self.session.refresh(obj)
            return obj
        except IntegrityError as e:
            await self.session.rollback()
            raise DataIntegrityError(message=f"Database integrity conflict updating {self.model.__name__}: {str(e.orig)}")
        except SQLAlchemyError as e:
            await self.session.rollback()
            raise e

    async def delete(self, obj: T) -> None:
        """Delete a model instance."""
        try:
            await self.session.delete(obj)
            await self.session.commit()
        except IntegrityError:
            await self.session.rollback()
            raise DataIntegrityError(message=f"Cannot delete {self.model.__name__}. It is referenced by other records (Foreign Key Constraint).")
        except SQLAlchemyError as e:
            await self.session.rollback()
            raise e
