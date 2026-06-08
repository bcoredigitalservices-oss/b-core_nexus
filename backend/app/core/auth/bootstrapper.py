import os
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from app.database import get_db as get_db_session
from app.core.auth.models import User
from app.core.auth.schemas import UserRead
from app.core.auth.security import pwd_context

async def initialize_system_admin(db: AsyncSession) -> UserRead:
    # Step 1: Check if a Tier 0 (Root) user already exists
    result = await db.execute(select(User).where(User.role_tier == 0))
    existing_root = result.scalars().first()

    # Step 2: If root user exists, brick the initialization phase
    if existing_root is not None:
        raise HTTPException(
            status_code=status.HTTP_410_GONE,
            detail="Instance initialization phase closed. Root account already exists."
        )

    # Step 3: Read root credentials from environment variables
    email = os.getenv("ADMIN_INITIAL_EMAIL")
    password = os.getenv("ADMIN_INITIAL_PASSWORD")
    if not email or not password:
        raise RuntimeError("ADMIN_INITIAL_EMAIL and ADMIN_INITIAL_PASSWORD environment variables must be set.")

    # Step 4: Hash the password and instantiate the User model
    hashed_password = pwd_context.hash(password)
    new_user = User(
        email=email,
        hashed_password=hashed_password,
        role_tier=0,
        is_active=True
    )

    # Step 5: Save and refresh the record
    db.add(new_user)
    await db.commit()
    await db.refresh(new_user)

    return UserRead.model_validate(new_user)

init_router = APIRouter()

@init_router.post("/init", response_model=UserRead)
async def init_system(db: AsyncSession = Depends(get_db_session)):
    return await initialize_system_admin(db)
