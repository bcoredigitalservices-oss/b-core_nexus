import uuid
from datetime import datetime, timedelta, timezone
from jose import jwt, JWTError
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from passlib.context import CryptContext
from app.config import settings
from app.database import get_db as get_db_session
from app.core.auth.models import User

SECRET_KEY = settings.SECRET_KEY
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 720

# Initialize CryptContext using the bcrypt algorithm
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# tokenUrl must point to /api/core/auth/login
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/core/auth/login")

async def create_access_token(data: dict, db: AsyncSession) -> str:
    user_id = data.get("sub")
    permissions = []
    if user_id:
        try:
            user_uuid = uuid.UUID(user_id) if isinstance(user_id, str) else user_id
            from app.models.user import user_permissions, Permission
            # Query ONLY direct user permissions
            stmt = (
                select(Permission.name)
                .join(user_permissions, Permission.id == user_permissions.c.permission_id)
                .where(user_permissions.c.user_id == user_uuid)
            )
            res = await db.execute(stmt)
            permissions = list(set(res.scalars().all()))
        except Exception as e:
            print(f"[JWT] Failed to query user permissions: {e}")

    to_encode = data.copy()
    to_encode["permissions"] = permissions
    expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

def create_refresh_token(data: dict) -> str:
    to_encode = data.copy()
    # 7 days expiration for refresh tokens
    expire = datetime.now(timezone.utc) + timedelta(days=7)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

def create_temp_token(data: dict) -> str:
    to_encode = data.copy()
    # 5 minutes expiration for temporary session tokens
    expire = datetime.now(timezone.utc) + timedelta(minutes=5)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

def create_invite_token(email: str, role_id: uuid.UUID, first_name: str, last_name: str) -> str:
    to_encode = {
        "sub": email,
        "role_id": str(role_id),
        "first_name": first_name,
        "last_name": last_name,
        "type": "invite"
    }
    # 48 hours expiration for invitation tokens
    expire = datetime.now(timezone.utc) + timedelta(hours=48)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


async def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: AsyncSession = Depends(get_db_session)
) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        permissions = payload.get("permissions", [])
        if user_id is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception

    # Query the user profile
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalars().first()
    if user is None:
        raise credentials_exception
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Inactive user account"
        )
    user.permissions = permissions
    return user


class RequiresPermission:
    def __init__(self, required_permission: str):
        self.required_permission = required_permission

    async def __call__(
        self,
        token: str = Depends(oauth2_scheme),
        db: AsyncSession = Depends(get_db_session)
    ) -> User:
        credentials_exception = HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
        try:
            payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
            user_id: str = payload.get("sub")
            if user_id is None:
                raise credentials_exception
            permissions = payload.get("permissions", [])
        except JWTError:
            raise credentials_exception

        # Check permission or wildcard (*:*)
        if self.required_permission not in permissions and "*:*" not in permissions:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access denied: Requires permission '{self.required_permission}'"
            )

        # Retrieve user record
        result = await db.execute(select(User).where(User.id == user_id))
        user = result.scalars().first()
        if user is None:
            raise credentials_exception
        if not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Inactive user account"
            )
        user.permissions = permissions
        return user
