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

def create_access_token(data: dict) -> str:
    to_encode = data.copy()
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

def create_invite_token(email: str, target_role_tier: int) -> str:
    to_encode = {
        "sub": email,
        "target_role_tier": target_role_tier,
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
    from app.core.context import set_current_user_tier
    set_current_user_tier(user.role_tier)
    return user

from app.core.exceptions import InsufficientClearanceError

def require_tier(max_allowed_tier: int):
    async def dependency(current_user: User = Depends(get_current_user)) -> User:
        if current_user.role_tier > max_allowed_tier:
            raise InsufficientClearanceError()
        return current_user
    return dependency

def require_role(min_tier: int):
    return require_tier(min_tier)

def require_functional_role(required_roles: list[str]):
    async def dependency(current_user: User = Depends(get_current_user)) -> User:
        if current_user.role_tier == 0:
            return current_user
        if not any(role in current_user.functional_roles for role in required_roles):
            raise InsufficientClearanceError("Insufficient operational clearance for functional role.")
        return current_user
    return dependency

# For backward compatibility with existing routers
class RoleTierChecker:
    def __init__(self, required_tier: int):
        self.required_tier = required_tier

    async def __call__(self, current_user: User = Depends(get_current_user)) -> User:
        if current_user.role_tier > self.required_tier:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access denied: Requires Tier {self.required_tier} or higher privileges."
            )
        return current_user
