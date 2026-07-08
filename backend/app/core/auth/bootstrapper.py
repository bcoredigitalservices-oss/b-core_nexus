from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import func
from app.database import get_db as get_db_session
from app.core.auth.models import User
from app.core.auth.schemas import UserRead, SystemBootstrapRequest
from app.core.auth.security import pwd_context
from app.models.user import EmployeeProfile, Role, Permission, user_roles, user_permissions
from app.core.auth.totp import generate_totp_secret
init_router = APIRouter()

@init_router.post("/bootstrap", response_model=UserRead)
async def bootstrap_system(payload: SystemBootstrapRequest, db: AsyncSession = Depends(get_db_session)):
    # Constraint Guard: Check if the database has any users
    count_res = await db.execute(select(func.count()).select_from(User))
    user_count = count_res.scalar() or 0

    if user_count > 0:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Instance initialization phase closed. Users already exist."
        )

    # Hash the password and instantiate the User model
    hashed_password = pwd_context.hash(payload.password)
    new_user = User(
        email=payload.email,
        hashed_password=hashed_password,
        mfa_secret=generate_totp_secret(),
        mfa_enabled=False,
        is_active=True,
        custom_attributes={"notes": "Bootstrap System Administrator"}
    )

    db.add(new_user)
    await db.flush() # flush to get new_user.id

    # Create linked employee profile
    profile = EmployeeProfile(
        user_id=new_user.id,
        first_name=payload.first_name,
        last_name=payload.last_name
    )
    db.add(profile)
    await db.flush()

    # Map to admin role and *:* permission (which should be seeded by init_db.py)
    admin_role_res = await db.execute(select(Role).where(Role.name == "admin"))
    admin_role = admin_role_res.scalars().first()
    
    super_perm_res = await db.execute(select(Permission).where(Permission.name == "*:*"))
    super_perm = super_perm_res.scalars().first()

    if not admin_role or not super_perm:
        # If roles/permissions are missing, the DB wasn't properly initialized.
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Database missing required base roles/permissions. Please run database initialization first."
        )

    # Link to admin role
    await db.execute(user_roles.insert().values(user_id=new_user.id, role_id=admin_role.id))
    
    # Assign *:* directly to admin user
    await db.execute(user_permissions.insert().values(user_id=new_user.id, permission_id=super_perm.id))
    
    await db.commit()
    await db.refresh(new_user)

    return new_user
