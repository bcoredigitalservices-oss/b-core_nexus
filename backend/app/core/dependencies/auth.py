from fastapi import Depends, HTTPException, status
from app.core.auth.security import get_current_user
from app.core.auth.models import User

def require_workspace_access(required_workspace: str):
    """
    FastAPI dependency that enforces workspace access control via RBAC permissions.
    """
    async def dependency(
        current_user: User = Depends(get_current_user)
    ) -> User:
        user_permissions = getattr(current_user, "permissions", [])
        
        # Super admin (*:*) or workspace-specific read/write/access permission
        allowed = (
            "*:*" in user_permissions or
            f"{required_workspace}:read" in user_permissions or
            f"{required_workspace}:write" in user_permissions or
            f"{required_workspace}:access" in user_permissions
        )
        
        if not allowed:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access to this workspace module is restricted."
            )

        return current_user
    return dependency
