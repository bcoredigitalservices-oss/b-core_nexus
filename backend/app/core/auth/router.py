import secrets
from datetime import datetime, timezone, timedelta
from typing import Optional
import pyotp
from fastapi import APIRouter, Depends, HTTPException, status, Response, Form
from fastapi.responses import JSONResponse
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from jose import JWTError, jwt
from app.database import get_db
from app.core.auth.models import User
from app.core.auth.schemas import (
    UserCreate,
    UserRead,
    Token,
    VerifyTOTPRequest,
    UserInviteRequest,
    UserRegisterRequest,
    OnboardVerifyRequest,
    OnboardCompleteRequest,
    OnboardPasswordRequest
)
from app.core.auth.security import (
    pwd_context,
    create_access_token,
    create_refresh_token,
    create_temp_token,
    create_invite_token,
    get_current_user,
    require_role,
    RoleTierChecker,
    SECRET_KEY,
    ALGORITHM
)
from app.core.auth.totp import (
    generate_totp_secret,
    get_provisioning_uri,
    verify_totp_code
)

class OAuth2AliasAPIRouter(APIRouter):
    def __init__(self, *args, **kwargs):
        self._routes_list = []
        super().__init__(*args, **kwargs)

    @property
    def routes(self):
        app = None
        try:
            import inspect
            from fastapi import FastAPI
            for frame_info in inspect.stack():
                frame = frame_info.frame
                if "self" in frame.f_locals and isinstance(frame.f_locals["self"], FastAPI):
                    app = frame.f_locals["self"]
                    break
        except Exception:
            pass

        if not app:
            try:
                import gc
                from fastapi import FastAPI
                for obj in gc.get_objects():
                    if isinstance(obj, FastAPI):
                        app = obj
                        break
            except Exception:
                pass

        if app:
            if not any(r.path == "/api/core/auth/token" for r in app.routes):
                app.add_api_route(
                    "/api/core/auth/token",
                    oauth2_token_alias,
                    methods=["POST"],
                    response_model=Token,
                    tags=["Authentication"],
                    summary="OAuth2 compatible token login alias"
                )
        return self._routes_list

    @routes.setter
    def routes(self, value):
        self._routes_list = value

auth_router = OAuth2AliasAPIRouter(prefix="/auth", tags=["Authentication"])
router = auth_router

@auth_router.post("/invite", status_code=status.HTTP_201_CREATED)
async def invite_user(
    payload: UserInviteRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(min_tier=0))
):
    # Check if user exists
    result = await db.execute(select(User).filter(User.email == payload.email))
    existing_user = result.scalars().first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User already exists"
        )
    
    # Generate secure 64-character URL-safe random string
    token = secrets.token_urlsafe(48)
    
    new_user = User(
        email=payload.email,
        first_name=payload.first_name,
        last_name=payload.last_name,
        role_tier=1,  # Strict: default to 1 (Executive Admin)
        is_active=False,
        invite_token=token,
        token_expires_at=datetime.now(timezone.utc) + timedelta(hours=24),
        hashed_password=None,
        mfa_enabled=False
    )
    db.add(new_user)
    await db.commit()
    await db.refresh(new_user)
    
    import os
    frontend_url = os.environ.get("FRONTEND_URL", "http://45.88.191.254:3005")
    onboarding_url = f"{frontend_url}/onboard?token={token}"
    print(f"\n[DEV MAIL] Send to {payload.email}: {onboarding_url}\n", flush=True)
    
    return {"status": "success", "message": "Invitation created successfully"}


@auth_router.post("/onboard/verify")
async def onboard_verify(
    payload: OnboardVerifyRequest,
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(User).where(User.invite_token == payload.token))
    user = result.scalars().first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired token"
        )
        
    if user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Account has already been claimed/activated"
        )
        
    expires_at = user.token_expires_at
    if expires_at is not None:
        if expires_at.tzinfo is None:
            expires_at = expires_at.replace(tzinfo=timezone.utc)
        if expires_at < datetime.now(timezone.utc):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Onboarding token has expired"
            )
            
    return {
        "email": user.email
    }


@auth_router.post("/onboard/password")
async def onboard_password(
    payload: OnboardPasswordRequest,
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(User).where(User.invite_token == payload.token))
    user = result.scalars().first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired token"
        )
        
    expires_at = user.token_expires_at
    if expires_at is not None:
        if expires_at.tzinfo is None:
            expires_at = expires_at.replace(tzinfo=timezone.utc)
        if expires_at < datetime.now(timezone.utc):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Onboarding token has expired"
            )
            
    # Hash and save new password
    user.hashed_password = pwd_context.hash(payload.new_password)
    
    # Generate TOTP secret and save to user
    user.totp_secret = generate_totp_secret()
    
    # Set active and clear invite token
    user.is_active = True
    user.invite_token = None
    user.token_expires_at = None
    user.mfa_enabled = False
    
    db.add(user)
    await db.commit()
    
    return {"status": "success", "message": "Password configured successfully"}

@auth_router.post("/register", response_model=UserRead, status_code=status.HTTP_201_CREATED)
async def register_user(payload: UserRegisterRequest, db: AsyncSession = Depends(get_db)):
    try:
        decoded = jwt.decode(payload.invite_token, SECRET_KEY, algorithms=[ALGORITHM])
        if decoded.get("type") != "invite":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid token type."
            )
        email = decoded.get("sub")
        role_tier = decoded.get("target_role_tier")
        if email is None or role_tier is None:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Token payload is missing required claims."
            )
    except JWTError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid or expired invitation token: {str(e)}"
        )

    # Check if user already exists
    result = await db.execute(select(User).filter(User.email == email))
    existing_user = result.scalars().first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    hashed_password = pwd_context.hash(payload.password)
    new_user = User(
        email=email,
        hashed_password=hashed_password,
        role_tier=role_tier,
        is_active=True
    )
    db.add(new_user)
    await db.commit()
    await db.refresh(new_user)
    return new_user

@auth_router.post("/login")
async def login(
    response: Response,
    form_data: OAuth2PasswordRequestForm = Depends(),
    totp_code: Optional[str] = Form(None),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(User).where(User.email == form_data.username))
    user = result.scalars().first()
    
    if not user or not user.hashed_password or not pwd_context.verify(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Inactive user account"
        )
        
    # MFA Intercept Modification
    if not user.mfa_enabled:
        if user.role_tier == 0:
            # Mandatory MFA for Tier 0
            if not user.totp_secret:
                user.totp_secret = generate_totp_secret()
                db.add(user)
                await db.commit()
                await db.refresh(user)

            if totp_code:
                if not user.totp_secret or not verify_totp_code(user.totp_secret, totp_code):
                    raise HTTPException(
                        status_code=status.HTTP_401_UNAUTHORIZED,
                        detail="Invalid verification code"
                    )
                user.mfa_enabled = True
                db.add(user)
                await db.commit()
            else:
                setup_uri = get_provisioning_uri(user.email, user.totp_secret)
                return JSONResponse(
                    status_code=status.HTTP_403_FORBIDDEN,
                    content={"detail": "MFA_SETUP_REQUIRED", "setup_uri": setup_uri}
                )
        else:
            # Optional MFA for other Tiers
            if totp_code:
                if not user.totp_secret:
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail="TOTP not initialized"
                    )
                if not verify_totp_code(user.totp_secret, totp_code):
                    raise HTTPException(
                        status_code=status.HTTP_401_UNAUTHORIZED,
                        detail="Invalid verification code"
                    )
                user.mfa_enabled = True
                db.add(user)
                await db.commit()
            # If no totp_code, proceed to login
    else:
        # mfa_enabled == True
        if not totp_code:
            return JSONResponse(
                status_code=status.HTTP_403_FORBIDDEN,
                content={"detail": "MFA_CODE_REQUIRED"}
            )
        if not user.totp_secret or not verify_totp_code(user.totp_secret, totp_code):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid verification code"
            )
    
    access_token = create_access_token(data={"sub": str(user.id), "role_tier": user.role_tier})
    refresh_token = create_refresh_token(data={"sub": str(user.id)})
    
    response.set_cookie(
        key="refresh_token",
        value=refresh_token,
        httponly=True,
        secure=True,
        samesite="strict",
        max_age=7 * 24 * 60 * 60 # 7 days
    )
    return {"access_token": access_token, "token_type": "bearer"}

@auth_router.post("/login/verify-totp")
async def verify_totp(
    response: Response,
    payload: VerifyTOTPRequest,
    db: AsyncSession = Depends(get_db)
):
    try:
        decoded = jwt.decode(payload.temp_token, SECRET_KEY, algorithms=[ALGORITHM])
        if decoded.get("type") != "temp_totp":
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token type")
        user_id = decoded.get("sub")
    except JWTError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired temporary token")

    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalars().first()
    
    if not user or not user.is_active:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found or inactive")
        
    if not user.totp_secret:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="TOTP is not configured for this user")
        
    if not verify_totp_code(user.totp_secret, payload.code):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid verification code")
        
    access_token = create_access_token(data={"sub": str(user.id), "role_tier": user.role_tier})
    refresh_token = create_refresh_token(data={"sub": str(user.id)})
    
    response.set_cookie(
        key="refresh_token",
        value=refresh_token,
        httponly=True,
        secure=True,
        samesite="strict",
        max_age=7 * 24 * 60 * 60
    )
    return {"access_token": access_token, "token_type": "bearer"}

@auth_router.post("/totp/setup")
async def setup_totp(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    secret = generate_totp_secret()
    provisioning_uri = get_provisioning_uri(current_user.email, secret)
    
    current_user.totp_secret = secret
    db.add(current_user)
    await db.commit()
    
    return {
        "secret": secret,
        "provisioning_uri": provisioning_uri
    }

@auth_router.post("/token", response_model=Token)
async def login_for_access_token(
    form_data: OAuth2PasswordRequestForm = Depends(), 
    totp_code: Optional[str] = Form(None),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(User).filter(User.email == form_data.username))
    user = result.scalars().first()
    if not user or not user.hashed_password or not pwd_context.verify(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Inactive user account"
        )
    
    # MFA Intercept Modification
    if not user.mfa_enabled:
        if user.role_tier == 0:
            # Mandatory MFA for Tier 0
            if not user.totp_secret:
                user.totp_secret = generate_totp_secret()
                db.add(user)
                await db.commit()
                await db.refresh(user)

            if totp_code:
                if not user.totp_secret or not verify_totp_code(user.totp_secret, totp_code):
                    raise HTTPException(
                        status_code=status.HTTP_401_UNAUTHORIZED,
                        detail="Invalid verification code"
                    )
                user.mfa_enabled = True
                db.add(user)
                await db.commit()
            else:
                setup_uri = get_provisioning_uri(user.email, user.totp_secret)
                return JSONResponse(
                    status_code=status.HTTP_403_FORBIDDEN,
                    content={"detail": "MFA_SETUP_REQUIRED", "setup_uri": setup_uri}
                )
        else:
            # Optional MFA for other Tiers
            if totp_code:
                if not user.totp_secret:
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail="TOTP not initialized"
                    )
                if not verify_totp_code(user.totp_secret, totp_code):
                    raise HTTPException(
                        status_code=status.HTTP_401_UNAUTHORIZED,
                        detail="Invalid verification code"
                    )
                user.mfa_enabled = True
                db.add(user)
                await db.commit()
            # If no totp_code, proceed to login
    else:
        # mfa_enabled == True
        if not totp_code:
            return JSONResponse(
                status_code=status.HTTP_403_FORBIDDEN,
                content={"detail": "MFA_CODE_REQUIRED"}
            )
        if not user.totp_secret or not verify_totp_code(user.totp_secret, totp_code):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid verification code"
            )
            
    access_token = create_access_token(
        data={"sub": str(user.id), "role_tier": user.role_tier}
    )
    return {"access_token": access_token, "token_type": "bearer"}

async def oauth2_token_alias(
    form_data: OAuth2PasswordRequestForm = Depends(), 
    totp_code: Optional[str] = Form(None),
    db: AsyncSession = Depends(get_db)
):
    return await login_for_access_token(form_data=form_data, totp_code=totp_code, db=db)

@auth_router.get("/me", response_model=UserRead)
async def read_users_me(current_user: User = Depends(get_current_user)):
    return current_user

@auth_router.get("/users", response_model=list[UserRead])
async def list_users(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(min_tier=0))
):
    result = await db.execute(select(User).order_by(User.email))
    users = result.scalars().all()
    return users

@auth_router.post("/users/{user_id}/revoke")
async def revoke_user_session(
    user_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(min_tier=0))
):
    import uuid
    try:
        user_uuid = uuid.UUID(user_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid user ID format.")
        
    result = await db.execute(select(User).where(User.id == user_uuid))
    user = result.scalars().first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")
        
    user.is_active = False
    db.add(user)
    await db.commit()
    return {"message": "Session successfully revoked", "user_id": str(user.id)}

