import os
import uuid
from typing import AsyncGenerator
from dotenv import load_dotenv
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, declared_attr
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy import Index

# Locate and load the parent directory's .env file
dotenv_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), ".env")
load_dotenv(dotenv_path)

# 1. Read and validate DATABASE_URL environment variable
DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL or not DATABASE_URL.startswith("postgresql+asyncpg://"):
    raise ValueError(
        "CRITICAL DATABASE INITIALIZATION FAILURE: DATABASE_URL must be defined in the environment "
        "and must use the 'postgresql+asyncpg://' dialect to run asynchronous transactions."
    )

# 2. Initialize the async engine with enterprise pooling configurations
engine = create_async_engine(
    DATABASE_URL,
    echo=False,
    future=True,
    pool_size=20,
    max_overflow=10,
    pool_pre_ping=True
)

# 3. Configure the async session maker
AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False
)

# 4. Define declarative base class and abstract CoreModel
class Base(DeclarativeBase):
    pass

class CoreModel(Base):
    __abstract__ = True

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    custom_attributes: Mapped[dict] = mapped_column(JSONB, default=dict, nullable=False)

    @declared_attr
    def __table_args__(cls):
        return (
            Index(f"idx_{cls.__tablename__}_custom_attributes", "custom_attributes", postgresql_using="gin"),
        )

# 5. Async database session dependency lifecycle handler
async def get_db_session() -> AsyncGenerator[AsyncSession, None]:
    session = AsyncSessionLocal()
    try:
        yield session
    finally:
        await session.close()

# Alias for backward compatibility with get_db imports
get_db = get_db_session
