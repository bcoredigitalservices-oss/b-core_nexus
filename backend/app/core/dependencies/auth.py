from fastapi import Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.database import get_db
from app.core.auth.security import get_current_user
from app.core.auth.models import User
from app.models.user import UserWorkspace

def require_workspace_access(required_workspace: str):
    """
    FastAPI dependency that enforces workspace isolation.
    Bypasses access restriction for Tier 0 (System Admin) and Tier 1 (Executive Admin) users.
    """
    async def dependency(
        current_user: User = Depends(get_current_user),
        db: AsyncSession = Depends(get_db)
    ) -> User:
        # If the user is a Tier 1 Admin (or Tier 0 Root Admin), bypass this check automatically and grant global access.
        if current_user.role_tier <= 1:
            return current_user

        # Query the user_workspaces mapping for that user
        stmt = select(UserWorkspace).where(
            UserWorkspace.user_id == current_user.id,
            UserWorkspace.workspace_string == required_workspace
        )
        result = await db.execute(stmt)
        allowed = result.scalars().first() is not None

        if not allowed:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access to this workspace module is restricted."
            )

        return current_user
    return dependency
