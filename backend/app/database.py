import os
import uuid
from typing import AsyncGenerator
from dotenv import load_dotenv
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, declared_attr
from sqlalchemy import Index, JSON as SQLAlchemyJSON
from sqlalchemy.dialects.postgresql import UUID, JSONB

# Locate and load the parent directory's .env file
dotenv_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), ".env")
load_dotenv(dotenv_path)

# 1. Read and validate DATABASE_URL environment variable
DATABASE_URL = os.getenv("DATABASE_URL")
if DATABASE_URL:
    DATABASE_URL = DATABASE_URL.strip()

# If DATABASE_URL is not provided, allow a safe local SQLite async fallback for
# developer convenience. This keeps the rest of the code working without
# requiring Postgres to be present during local development.
if not DATABASE_URL:
    # Use a file-based async SQLite DB in the backend folder
    dev_db_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "dev_bcore.db")
    DATABASE_URL = f"sqlite+aiosqlite:///{dev_db_path}"

# Validate supported async dialects
if not (DATABASE_URL.startswith("postgresql+asyncpg://") or DATABASE_URL.startswith("sqlite+aiosqlite://")):
    raise ValueError(
        "CRITICAL DATABASE INITIALIZATION FAILURE: DATABASE_URL must be defined in the environment "
        "and must use either the 'postgresql+asyncpg://' dialect for Postgres or 'sqlite+aiosqlite://' for local dev."
    )

# 2. Initialize the async engine with enterprise pooling configurations
is_postgres = DATABASE_URL.startswith("postgresql+asyncpg://")
JSONType = JSONB if is_postgres else SQLAlchemyJSON
if is_postgres:
    engine = create_async_engine(
        DATABASE_URL,
        echo=False,
        future=True,
        pool_size=20,
        max_overflow=10,
        pool_pre_ping=True
    )
else:
    # SQLite async engine: lighter-weight for local development
    engine = create_async_engine(
        DATABASE_URL,
        echo=False,
        future=True,
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
    custom_attributes: Mapped[dict] = mapped_column(JSONType, default=dict, nullable=False)

    @declared_attr
    def __table_args__(cls):
        if is_postgres:
            return (
                Index(f"idx_{cls.__tablename__}_custom_attributes", "custom_attributes", postgresql_using="gin"),
            )
        return ()

# 5. Async database session dependency lifecycle handler
async def get_db_session() -> AsyncGenerator[AsyncSession, None]:
    session = AsyncSessionLocal()
    try:
        yield session
    finally:
        await session.close()

# Alias for backward compatibility with get_db imports
get_db = get_db_session
