import secrets
from datetime import datetime, timezone, timedelta
from typing import Optional
import pyotp
from fastapi import APIRouter, Depends, HTTPException, status, Response, Form, Request
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
    UserRegisterRequest,
    OnboardVerifyRequest,
    OnboardCompleteRequest,
    OnboardPasswordRequest,
    RefreshTokenRequest
)
from app.core.auth.security import (
    pwd_context,
    create_access_token,
    create_refresh_token,
    create_temp_token,
    create_invite_token,
    get_current_user,
    SECRET_KEY,
    ALGORITHM,
    RequiresPermission
)
from app.core.auth.totp import (
    generate_totp_secret,
    get_provisioning_uri,
    verify_totp_code
)

auth_router = APIRouter(prefix="/auth", tags=["Authentication"])
router = auth_router


@auth_router.post("/onboard/verify")
async def onboard_verify(
    payload: OnboardVerifyRequest,
    db: AsyncSession = Depends(get_db)
):
    try:
        decoded = jwt.decode(payload.token, SECRET_KEY, algorithms=[ALGORITHM])
        if decoded.get("type") != "invite":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid token type"
            )
        email = decoded.get("sub")
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired token"
        )
        
    result = await db.execute(select(User).filter(User.email == email))
    existing_user = result.scalars().first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Account has already been claimed/activated"
        )
            
    return {
        "email": email
    }


@auth_router.post("/onboard/password")
async def onboard_password(
    payload: OnboardPasswordRequest,
    db: AsyncSession = Depends(get_db)
):
    try:
        decoded = jwt.decode(payload.token, SECRET_KEY, algorithms=[ALGORITHM])
        if decoded.get("type") != "invite":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid token type"
            )
        email = decoded.get("sub")
        role_id_str = decoded.get("role_id")
        first_name = decoded.get("first_name")
        last_name = decoded.get("last_name")
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired token"
        )
        
    # Verify user does not already exist
    result = await db.execute(select(User).filter(User.email == email))
    existing_user = result.scalars().first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Account has already been claimed/activated"
        )

    # Verify role exists
    from app.models.user import Role, EmployeeProfile, user_roles
    import uuid
    role_uuid = uuid.UUID(role_id_str)
    role_res = await db.execute(select(Role).where(Role.id == role_uuid))
    role = role_res.scalars().first()
    if not role:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Designated role not found"
        )
        
    # Create the User record
    new_user = User(
        email=email,
        password_hash=pwd_context.hash(payload.new_password),
        mfa_secret=generate_totp_secret(),
        mfa_enabled=False,
        is_active=True
    )
    db.add(new_user)
    await db.flush() # flush to generate new_user.id
    
    # Create empty linked EmployeeProfile record
    profile = EmployeeProfile(
        user_id=new_user.id,
        first_name=first_name,
        last_name=last_name
    )
    db.add(profile)
    
    # Map the user to the role in the user_roles junction table
    await db.execute(user_roles.insert().values(user_id=new_user.id, role_id=role.id))
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
        role_id_str = decoded.get("role_id")
        first_name = decoded.get("first_name")
        last_name = decoded.get("last_name")
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
    
    from app.models.user import Role, EmployeeProfile, user_roles
    import uuid
    role_uuid = uuid.UUID(role_id_str)
    role_res = await db.execute(select(Role).where(Role.id == role_uuid))
    role = role_res.scalars().first()
    if not role:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Role not found"
        )

    hashed_password = pwd_context.hash(payload.password)
    new_user = User(
        email=email,
        password_hash=hashed_password,
        mfa_secret=generate_totp_secret(),
        mfa_enabled=False,
        is_active=True
    )
    db.add(new_user)
    await db.flush()

    profile = EmployeeProfile(
        user_id=new_user.id,
        first_name=first_name,
        last_name=last_name
    )
    db.add(profile)

    await db.execute(user_roles.insert().values(user_id=new_user.id, role_id=role.id))
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
        is_admin_or_manager = any(r.name in ["admin", "system_manager"] for r in getattr(user, 'roles', []))
        if is_admin_or_manager:
            # Mandatory MFA for Admin/Manager
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
            # Optional MFA for other roles
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
    
    access_token = await create_access_token(data={"sub": str(user.id)}, db=db)
    refresh_token = create_refresh_token(data={"sub": str(user.id)})
    
    response.set_cookie(
        key="refresh_token",
        value=refresh_token,
        httponly=True,
        secure=True,
        samesite="strict",
        max_age=7 * 24 * 60 * 60 # 7 days
    )
    return {"access_token": access_token, "refresh_token": refresh_token, "token_type": "bearer"}


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
    response: Response,
    form_data: OAuth2PasswordRequestForm = Depends(), 
    totp_code: Optional[str] = Form(None),
    db: AsyncSession = Depends(get_db)
):
    return await login(response=response, form_data=form_data, totp_code=totp_code, db=db)

@auth_router.post("/refresh")
async def refresh_token(
    response: Response,
    request: Request,
    payload: Optional[RefreshTokenRequest] = None,
    db: AsyncSession = Depends(get_db)
):
    refresh_token = None
    if payload and payload.refresh_token:
        refresh_token = payload.refresh_token
    else:
        refresh_token = request.cookies.get("refresh_token")
    
    if not refresh_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Refresh token missing"
        )
        
    try:
        decoded = jwt.decode(refresh_token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = decoded.get("sub")
        if not user_id:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid refresh token payload"
            )
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired refresh token"
        )
        
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalars().first()
    
    if not user or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found or inactive"
        )
        
    new_access_token = await create_access_token(data={"sub": str(user.id)}, db=db)
    new_refresh_token = create_refresh_token(data={"sub": str(user.id)})
    
    response.set_cookie(
        key="refresh_token",
        value=new_refresh_token,
        httponly=True,
        secure=True,
        samesite="strict",
        max_age=7 * 24 * 60 * 60
    )
    
    return {
        "access_token": new_access_token,
        "refresh_token": new_refresh_token,
        "token_type": "bearer"
    }

@auth_router.get("/me", response_model=UserRead)
async def read_users_me(current_user: User = Depends(get_current_user)):
    return current_user

@auth_router.get("/users", response_model=list[UserRead])
async def list_users(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(RequiresPermission("user:read"))
):
    result = await db.execute(
        select(User)
        .order_by(User.email)
    )
    users = result.scalars().all()
    return users

