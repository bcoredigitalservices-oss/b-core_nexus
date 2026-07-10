import secrets
import uuid
from datetime import datetime, timezone, timedelta
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Request
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.database import get_db
from app.core.auth.security import get_current_user, create_invite_token
from app.core.auth.models import User
from app.core.auth.schemas import UserProfileUpdate, UserRead
from app.models.user import Role, user_roles, Permission, role_permissions, user_permissions
from app.models.organization import Organization, Department, DepartmentOut
from app.core.iam.email import send_onboarding_email

WORKSPACE_DEFINITIONS = [
    {"key": "accounting", "label": "Accounting", "operations": ["read", "write", "create", "delete", "print", "email", "export", "share", "report", "import", "mask"]},
    {"key": "invoicing", "label": "Invoicing", "operations": ["read", "write", "create", "delete", "print", "email", "export", "share", "report", "import", "mask"]},
    {"key": "payments", "label": "Payments", "operations": ["read", "write", "create", "delete", "print", "email", "export", "share", "report", "import", "mask"]},
    {"key": "banking", "label": "Banking", "operations": ["read", "write", "create", "delete", "print", "email", "export", "share", "report", "import", "mask"]},
    {"key": "taxes", "label": "Taxes", "operations": ["read", "write", "create", "delete", "print", "email", "export", "share", "report", "import", "mask"]},
    {"key": "reports", "label": "Reports", "operations": ["read", "write", "create", "delete", "print", "email", "export", "share", "report", "import", "mask"]},
    {"key": "budget", "label": "Budget", "operations": ["read", "write", "create", "delete", "print", "email", "export", "share", "report", "import", "mask"]},
    {"key": "shares", "label": "Shares", "operations": ["read", "write", "create", "delete", "print", "email", "export", "share", "report", "import", "mask"]},
    {"key": "assets", "label": "Assets", "operations": ["read", "write", "create", "delete", "print", "email", "export", "share", "report", "import", "mask"]},
    {"key": "products", "label": "Products / Items", "operations": ["read", "write", "create", "delete", "print", "email", "export", "share", "report", "import", "mask"]},
    {"key": "warehouse", "label": "Warehouse", "operations": ["read", "write", "create", "delete", "print", "email", "export", "share", "report", "import", "mask"]},
    {"key": "stock", "label": "Stock", "operations": ["read", "write", "create", "delete", "print", "email", "export", "share", "report", "import", "mask"]},
    {"key": "buying", "label": "Buying", "operations": ["read", "write", "create", "delete", "print", "email", "export", "share", "report", "import", "mask"]},
    {"key": "pos", "label": "POS", "operations": ["read", "write", "create", "delete", "print", "email", "export", "share", "report", "import", "mask"]},
    {"key": "crm", "label": "CRM", "operations": ["read", "write", "create", "delete", "print", "email", "export", "share", "report", "import", "mask"]},
    {"key": "sales", "label": "Sales", "operations": ["read", "write", "create", "delete", "print", "email", "export", "share", "report", "import", "mask"]},
    {"key": "support", "label": "Support", "operations": ["read", "write", "create", "delete", "print", "email", "export", "share", "report", "import", "mask"]},
    {"key": "field_ops", "label": "Field Ops", "operations": ["read", "write", "create", "delete", "print", "email", "export", "share", "report", "import", "mask"]},
    {"key": "maintenance", "label": "Maintenance", "operations": ["read", "write", "create", "delete", "print", "email", "export", "share", "report", "import", "mask"]},
    {"key": "manufacturing", "label": "Manufacturing", "operations": ["read", "write", "create", "delete", "print", "email", "export", "share", "report", "import", "mask"]},
    {"key": "projects", "label": "Projects", "operations": ["read", "write", "create", "delete", "print", "email", "export", "share", "report", "import", "mask"]},
    {"key": "qa", "label": "QA / QT", "operations": ["read", "write", "create", "delete", "print", "email", "export", "share", "report", "import", "mask"]},
    {"key": "logistics", "label": "Logistics", "operations": ["read", "write", "create", "delete", "print", "email", "export", "share", "report", "import", "mask"]},
    {"key": "expenses", "label": "Expenses", "operations": ["read", "write", "create", "delete", "print", "email", "export", "share", "report", "import", "mask"]},
    {"key": "hr", "label": "HR", "operations": ["read", "write", "create", "delete", "print", "email", "export", "share", "report", "import", "mask"]},
    {"key": "payroll", "label": "Payroll", "operations": ["read", "write", "create", "delete", "print", "email", "export", "share", "report", "import", "mask"]},
    {"key": "attendance", "label": "Attendance", "operations": ["read", "write", "create", "delete", "print", "email", "export", "share", "report", "import", "mask"]},
    {"key": "recruitment", "label": "Recruitment", "operations": ["read", "write", "create", "delete", "print", "email", "export", "share", "report", "import", "mask"]},
    {"key": "performance", "label": "Performance", "operations": ["read", "write", "create", "delete", "print", "email", "export", "share", "report", "import", "mask"]},
    {"key": "leaves", "label": "Leaves", "operations": ["read", "write", "create", "delete", "print", "email", "export", "share", "report", "import", "mask"]},
    {"key": "chats", "label": "Chats", "operations": ["read", "write", "create", "delete", "print", "email", "export", "share", "report", "import", "mask"]},
    {"key": "employee_groups", "label": "Employee Groups", "operations": ["read", "write", "create", "delete", "print", "email", "export", "share", "report", "import", "mask"]},
    {"key": "email", "label": "Email", "operations": ["read", "write", "create", "delete", "print", "email", "export", "share", "report", "import", "mask"]},
    {"key": "message", "label": "Message", "operations": ["read", "write", "create", "delete", "print", "email", "export", "share", "report", "import", "mask"]},
    {"key": "marketing", "label": "Marketing / Campaigns", "operations": ["read", "write", "create", "delete", "print", "email", "export", "share", "report", "import", "mask"]},
    {"key": "website", "label": "Website", "operations": ["read", "write", "create", "delete", "print", "email", "export", "share", "report", "import", "mask"]},
    {"key": "internals", "label": "Internals", "operations": ["read", "write", "create", "delete", "print", "email", "export", "share", "report", "import", "mask"]},
    {"key": "cog", "label": "Settings / Cog", "operations": ["read", "write", "create", "delete", "print", "email", "export", "share", "report", "import", "mask"]},
]

router = APIRouter(prefix="/iam", tags=["Identity & Access Management (IAM)"])

# ── Dependency Guards ────────────────────────────────────────────────────────
def require_iam_privilege(current_user: User = Depends(get_current_user)):
    user_permissions = getattr(current_user, "permissions", [])
    if "*:*" not in user_permissions and "iam:manage" not in user_permissions:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Forbidden: Admin or Executive privilege required to manage directory and IAM permissions."
        )
    return current_user

# Helper to resolve first Organization ID
async def get_default_org_id(db: AsyncSession) -> uuid.UUID:
    res = await db.execute(select(Organization))
    org = res.scalars().first()
    if not org:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No default organization configured. Run init_db first."
        )
    return org.id

# ── Schemas ──────────────────────────────────────────────────────────────────
class DepartmentCreate(BaseModel):
    name: str = Field(..., min_length=1)
    description: Optional[str] = None
    manager_id: Optional[uuid.UUID] = None
    parent_id: Optional[uuid.UUID] = None
    organization_id: Optional[uuid.UUID] = None

class UserInvite(BaseModel):
    email: str = Field(..., min_length=3)
    first_name: str = Field(..., min_length=1)
    last_name: str = Field(..., min_length=1)
    role_id: uuid.UUID
    designation: Optional[str] = None
    department_id: Optional[uuid.UUID] = None

class AccessUpdate(BaseModel):
    designation: Optional[str] = None
    role_id: Optional[uuid.UUID] = None
    department_id: Optional[uuid.UUID] = None
    functional_roles: Optional[List[str]] = None

class RoleCreate(BaseModel):
    name: str = Field(..., min_length=1)
    description: Optional[str] = None

class RoleRead(BaseModel):
    id: uuid.UUID
    name: str
    description: Optional[str] = None
    
    class Config:
        from_attributes = True

class RoleUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None

class PermissionRead(BaseModel):
    id: uuid.UUID
    name: str

    class Config:
        from_attributes = True

class RolePermissionsUpdate(BaseModel):
    permission_ids: List[uuid.UUID]

class UserRoleUpdate(BaseModel):
    role_id: uuid.UUID

class CopyPermissionsRequest(BaseModel):
    source_user_id: uuid.UUID

class UserStatusUpdate(BaseModel):
    is_active: bool

class AdminPasswordResetRequest(BaseModel):
    new_password: str = Field(..., min_length=12)
    require_mfa_reset: bool = False

# ── Routes ───────────────────────────────────────────────────────────────────

@router.post("/departments", status_code=status.HTTP_201_CREATED)
async def create_department(
    payload: DepartmentCreate,
    db: AsyncSession = Depends(get_db),
    _ = Depends(require_iam_privilege)
):
    org_id = payload.organization_id or await get_default_org_id(db)
    
    # Verify manager exists if provided
    if payload.manager_id:
        res = await db.execute(select(User).where(User.id == payload.manager_id))
        if not res.scalars().first():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Manager User with ID {payload.manager_id} not found."
            )
            
    # Verify parent department exists if provided
    if payload.parent_id:
        p_res = await db.execute(select(Department).where(Department.id == payload.parent_id))
        if not p_res.scalars().first():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Parent Department with ID {payload.parent_id} not found."
            )

    dept = Department(
        organization_id=org_id,
        name=payload.name,
        description=payload.description,
        manager_id=payload.manager_id,
        parent_id=payload.parent_id
    )
    db.add(dept)
    await db.flush()
    await db.commit()
    await db.refresh(dept)
    
    return {
        "id": dept.id,
        "name": dept.name,
        "description": dept.description,
        "manager_id": dept.manager_id,
        "parent_id": dept.parent_id,
    }

@router.get("/roles")
async def list_roles(db: AsyncSession = Depends(get_db), _ = Depends(require_iam_privilege)):
    res = await db.execute(select(Role))
    roles = res.scalars().all()
    return [{"id": r.id, "name": r.name, "description": r.description} for r in roles]

# Workspaces creation endpoint removed

@router.post("/users/invite", status_code=status.HTTP_201_CREATED)
async def invite_user(
    payload: UserInvite,
    request: Request,
    db: AsyncSession = Depends(get_db),
    _ = Depends(require_iam_privilege)
):
    # Check duplicate email
    res = await db.execute(select(User).where(User.email == payload.email))
    if res.scalars().first():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"User with email '{payload.email}' already exists."
        )
        
    # Check department if provided
    if payload.department_id:
        res = await db.execute(select(Department).where(Department.id == payload.department_id))
        if not res.scalars().first():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Department ID {payload.department_id} not found."
            )
            
    # Verify role exists
    role_res = await db.execute(select(Role).where(Role.id == payload.role_id))
    role = role_res.scalars().first()
    if not role:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Role not found"
        )
            
    # Workspace mapping skipped
            
    # Generate secure JWT invitation token
    token = create_invite_token(
        email=payload.email,
        role_id=payload.role_id,
        first_name=payload.first_name,
        last_name=payload.last_name
    )
    
    # Resolve dynamic frontend URL
    import os
    frontend_url = os.environ.get("FRONTEND_URL")
    if not frontend_url:
        origin = request.headers.get("origin") or request.headers.get("referer")
        if origin:
            from urllib.parse import urlparse
            parsed = urlparse(origin)
            frontend_url = f"{parsed.scheme}://{parsed.netloc}"
        else:
            frontend_url = str(request.base_url).rstrip("/")
            if "localhost" in frontend_url or "127.0.0.1" in frontend_url:
                frontend_url = "http://localhost:5173"
    else:
        frontend_url = frontend_url.rstrip("/")

    onboarding_url = f"{frontend_url}/onboard?token={token}"
    print(f"\n[DEV MAIL] Provisioned User {payload.email}: {onboarding_url}\n", flush=True)
    
    # Send email onboarding dispatch via Resend
    email_dispatched = send_onboarding_email(payload.email, onboarding_url)
    
    return {
        "status": "success",
        "user_id": None,
        "invite_token": token,
        "onboarding_url": onboarding_url,
        "designation": payload.designation,
        "email_sent": email_dispatched
    }

@router.put("/users/{user_id}/profile", response_model=UserRead)
async def update_user_profile_admin(
    user_id: uuid.UUID,
    payload: UserProfileUpdate,
    db: AsyncSession = Depends(get_db),
    _ = Depends(require_iam_privilege)
):
    res = await db.execute(select(User).where(User.id == user_id))
    user = res.scalars().first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"User with ID {user_id} not found."
        )
        
    if not user.employee_profile:
        from app.models.user import EmployeeProfile
        user.employee_profile = EmployeeProfile(user_id=user.id)
        
    if payload.first_name is not None:
        user.first_name = payload.first_name
    if payload.last_name is not None:
        user.last_name = payload.last_name
    if payload.mobile_no is not None:
        user.mobile_no = payload.mobile_no
    if payload.gender is not None:
        user.gender = payload.gender
    if payload.birth_date is not None:
        user.birth_date = payload.birth_date
    if payload.bio is not None:
        user.bio = payload.bio
        
    db.add(user)
    await db.flush()
    await db.commit()
    await db.refresh(user)
    return user

@router.put("/users/{user_id}/access")
async def update_user_access(
    user_id: uuid.UUID,
    payload: AccessUpdate,
    db: AsyncSession = Depends(get_db),
    _ = Depends(require_iam_privilege)
):
    res = await db.execute(select(User).where(User.id == user_id))
    user = res.scalars().first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"User with ID {user_id} not found."
        )
        
    # Update properties
    if payload.designation is not None:
        user.designation = payload.designation
    if payload.department_id is not None:
        user.department_id = payload.department_id
        
    if payload.role_id is not None:
        role_res = await db.execute(select(Role).where(Role.id == payload.role_id))
        role = role_res.scalars().first()
        if not role:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Role with ID {payload.role_id} not found."
            )
        from sqlalchemy import delete
        await db.execute(delete(user_roles).where(user_roles.c.user_id == user.id))
        await db.execute(user_roles.insert().values(user_id=user.id, role_id=role.id))
        
    db.add(user)
    await db.flush()
    await db.commit()
    await db.refresh(user)
    
    return {
        "status": "success",
        "user_id": user.id,
        "designation": user.designation,
        "is_active": True,
        "is_totp_enabled": False,
        "department_id": user.department_id,
        "functional_roles": []
    }

@router.put("/users/{user_id}/status")
async def update_user_status(
    user_id: uuid.UUID,
    payload: UserStatusUpdate,
    db: AsyncSession = Depends(get_db),
    _ = Depends(require_iam_privilege)
):
    res = await db.execute(select(User).where(User.id == user_id))
    user = res.scalars().first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"User with ID {user_id} not found."
        )
        
    user.is_active = payload.is_active
    db.add(user)
    await db.commit()
    
    # If the user is suspended (is_active=False), broadcast a force_logout signal
    if not payload.is_active:
        try:
            from app.core.events.websocket import ws_manager
            await ws_manager.broadcast({
                "event_type": "force_logout",
                "payload": {"target_user_id": str(user_id)}
            })
        except Exception as e:
            print(f"[WS] ws_manager force_logout broadcast failed: {e}")

        try:
            from app.core.events.router import manager as event_manager
            await event_manager.broadcast(
                str(user_id),
                {
                    "event_type": "force_logout",
                    "payload": {"target_user_id": str(user_id)}
                }
            )
        except Exception as e:
            print(f"[WS] event_manager force_logout broadcast failed: {e}")
            
    status_msg = "reactivated" if payload.is_active else "suspended"
    return {
        "status": "success",
        "message": f"User successfully {status_msg}.",
        "user_id": str(user.id),
        "is_active": user.is_active
    }

@router.post("/users/{user_id}/reset-password")
async def reset_user_password(
    user_id: uuid.UUID,
    payload: AdminPasswordResetRequest,
    db: AsyncSession = Depends(get_db),
    _ = Depends(require_iam_privilege)
):
    res = await db.execute(select(User).where(User.id == user_id))
    user = res.scalars().first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"User with ID {user_id} not found."
        )
        
    from app.core.auth.security import pwd_context
    user.password_hash = pwd_context.hash(payload.new_password)
    
    if payload.require_mfa_reset:
        user.mfa_enabled = False
        user.mfa_secret = None
        
    db.add(user)
    await db.commit()
    
    # Broadcast force_logout signal to invalidate old sessions
    try:
        from app.core.events.websocket import ws_manager
        await ws_manager.broadcast({
            "event_type": "force_logout",
            "payload": {"target_user_id": str(user_id)}
        })
    except Exception as e:
        print(f"[WS] ws_manager force_logout broadcast failed: {e}")

    try:
        from app.core.events.router import manager as event_manager
        await event_manager.broadcast(
            str(user_id),
            {
                "event_type": "force_logout",
                "payload": {"target_user_id": str(user_id)}
            }
        )
    except Exception as e:
        print(f"[WS] event_manager force_logout broadcast failed: {e}")
        
    return {
        "status": "success",
        "message": "User password successfully reset. Existing sessions have been terminated.",
        "user_id": str(user.id)
    }

@router.get("/departments", response_model=List[DepartmentOut])
async def list_departments(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    res = await db.execute(select(Department))
    depts = res.scalars().all()
    
    result_list = []
    for dept in depts:
        manager_email = None
        if dept.manager_id:
            m_res = await db.execute(select(User).where(User.id == dept.manager_id))
            manager = m_res.scalars().first()
            if manager:
                manager_email = manager.email
                
        parent_name = None
        if dept.parent_id:
            p_res = await db.execute(select(Department).where(Department.id == dept.parent_id))
            parent_dept = p_res.scalars().first()
            if parent_dept:
                parent_name = parent_dept.name
                
        result_list.append({
            "id": dept.id,
            "name": dept.name,
            "description": dept.description,
            "manager_id": dept.manager_id,
            "manager_email": manager_email,
            "parent_id": dept.parent_id,
            "parent_name": parent_name,
            "organization_id": dept.organization_id
        })
    return result_list

# List workspaces endpoint removed

@router.get("/workspaces")
async def list_workspaces(_ = Depends(require_iam_privilege)):
    """Return the fixed list of ERP workspace modules and their operations."""
    return WORKSPACE_DEFINITIONS

@router.get("/permissions", response_model=List[PermissionRead])
async def list_permissions(
    db: AsyncSession = Depends(get_db),
    _ = Depends(require_iam_privilege)
):
    """List all available permissions in the system."""
    res = await db.execute(select(Permission))
    return res.scalars().all()

@router.get("/users/{user_id}/permissions", response_model=List[PermissionRead])
async def get_user_direct_permissions(
    user_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    _ = Depends(require_iam_privilege)
):
    """Get a user's direct workspace permissions."""
    res = await db.execute(select(User).where(User.id == user_id))
    if not res.scalars().first():
        raise HTTPException(status_code=404, detail="User not found.")
    stmt = (
        select(Permission)
        .join(user_permissions, Permission.id == user_permissions.c.permission_id)
        .where(user_permissions.c.user_id == user_id)
    )
    perm_res = await db.execute(stmt)
    return perm_res.scalars().all()

@router.put("/users/{user_id}/permissions")
async def update_user_direct_permissions(
    user_id: uuid.UUID,
    payload: RolePermissionsUpdate,
    db: AsyncSession = Depends(get_db),
    _ = Depends(require_iam_privilege)
):
    """Overwrite a user's direct workspace permissions."""
    res = await db.execute(select(User).where(User.id == user_id))
    if not res.scalars().first():
        raise HTTPException(status_code=404, detail="User not found.")
    if payload.permission_ids:
        perm_res = await db.execute(
            select(Permission).where(Permission.id.in_(payload.permission_ids))
        )
        found = perm_res.scalars().all()
        if len(found) != len(payload.permission_ids):
            raise HTTPException(status_code=400, detail="One or more invalid permission IDs.")
    from sqlalchemy import delete
    await db.execute(delete(user_permissions).where(user_permissions.c.user_id == user_id))
    if payload.permission_ids:
        for perm_id in payload.permission_ids:
            await db.execute(
                user_permissions.insert().values(user_id=user_id, permission_id=perm_id)
            )
    await db.commit()
    return {"status": "success", "message": "User workspace access updated successfully."}

@router.get("/users/{user_id}/details")
async def get_user_access_details(
    user_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    _ = Depends(require_iam_privilege)
):
    """Get a user's complete access profile."""
    res = await db.execute(select(User).where(User.id == user_id))
    user = res.scalars().first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")
    # Get user's roles (for display only)
    role_stmt = (
        select(Role)
        .join(user_roles, Role.id == user_roles.c.role_id)
        .where(user_roles.c.user_id == user_id)
    )
    role_res = await db.execute(role_stmt)
    roles = role_res.scalars().all()
    # Get direct permissions
    perm_stmt = (
        select(Permission)
        .join(user_permissions, Permission.id == user_permissions.c.permission_id)
        .where(user_permissions.c.user_id == user_id)
    )
    perm_res = await db.execute(perm_stmt)
    perms = perm_res.scalars().all()
    return {
        "user_id": user.id,
        "email": user.email,
        "is_active": user.is_active,
        "department_id": user.department_id,
        "designation": user.designation,
        "roles": [{"id": r.id, "name": r.name, "description": r.description} for r in roles],
        "permissions": [{"id": p.id, "name": p.name} for p in perms]
    }

@router.post("/users/{user_id}/copy-permissions")
async def copy_user_permissions(
    user_id: uuid.UUID,
    payload: CopyPermissionsRequest,
    db: AsyncSession = Depends(get_db),
    _ = Depends(require_iam_privilege)
):
    """Copy all direct permissions from a source user to the target user."""
    # Verify target user exists
    target_res = await db.execute(select(User).where(User.id == user_id))
    if not target_res.scalars().first():
        raise HTTPException(status_code=404, detail="Target user not found.")
    # Verify source user exists
    source_res = await db.execute(select(User).where(User.id == payload.source_user_id))
    if not source_res.scalars().first():
        raise HTTPException(status_code=404, detail="Source user not found.")
    # Get source user's direct permissions
    source_perms_stmt = (
        select(user_permissions.c.permission_id)
        .where(user_permissions.c.user_id == payload.source_user_id)
    )
    source_perms_res = await db.execute(source_perms_stmt)
    source_perm_ids = [row[0] for row in source_perms_res.fetchall()]
    # Overwrite target user's permissions
    from sqlalchemy import delete
    await db.execute(delete(user_permissions).where(user_permissions.c.user_id == user_id))
    for perm_id in source_perm_ids:
        await db.execute(
            user_permissions.insert().values(user_id=user_id, permission_id=perm_id)
        )
    await db.commit()
    return {
        "status": "success",
        "message": "Permissions copied successfully.",
        "permissions_copied": len(source_perm_ids)
    }

# ── Role & Permission Management Routes ────────────────────────────────────────

@router.get("/roles", response_model=List[RoleRead])
async def list_roles(
    db: AsyncSession = Depends(get_db),
    _ = Depends(require_iam_privilege)
):
    res = await db.execute(select(Role))
    return res.scalars().all()

@router.post("/roles", response_model=RoleRead, status_code=status.HTTP_201_CREATED)
async def create_role(
    payload: RoleCreate,
    db: AsyncSession = Depends(get_db),
    _ = Depends(require_iam_privilege)
):
    res = await db.execute(select(Role).where(Role.name == payload.name))
    if res.scalars().first():
        raise HTTPException(status_code=400, detail=f"Role '{payload.name}' already exists.")
        
    role = Role(name=payload.name, description=payload.description)
    db.add(role)
    await db.commit()
    await db.refresh(role)
    return role

@router.put("/roles/{role_id}", response_model=RoleRead)
async def update_role(
    role_id: uuid.UUID,
    payload: RoleUpdate,
    db: AsyncSession = Depends(get_db),
    _ = Depends(require_iam_privilege)
):
    res = await db.execute(select(Role).where(Role.id == role_id))
    role = res.scalars().first()
    if not role:
        raise HTTPException(status_code=404, detail="Role not found.")
        
    if payload.name is not None:
        dup_res = await db.execute(select(Role).where(Role.name == payload.name, Role.id != role_id))
        if dup_res.scalars().first():
            raise HTTPException(status_code=400, detail=f"Role '{payload.name}' already exists.")
        role.name = payload.name
    if payload.description is not None:
        role.description = payload.description
        
    db.add(role)
    await db.commit()
    await db.refresh(role)
    return role

@router.get("/roles/{role_id}/permissions", response_model=List[PermissionRead])
async def get_role_permissions(
    role_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    _ = Depends(require_iam_privilege)
):
    res = await db.execute(select(Role).where(Role.id == role_id))
    role = res.scalars().first()
    if not role:
        raise HTTPException(status_code=404, detail="Role not found.")
        
    stmt = (
        select(Permission)
        .join(role_permissions, Permission.id == role_permissions.c.permission_id)
        .where(role_permissions.c.role_id == role_id)
    )
    perm_res = await db.execute(stmt)
    return perm_res.scalars().all()

@router.put("/roles/{role_id}/permissions")
async def update_role_permissions(
    role_id: uuid.UUID,
    payload: RolePermissionsUpdate,
    db: AsyncSession = Depends(get_db),
    _ = Depends(require_iam_privilege)
):
    res = await db.execute(select(Role).where(Role.id == role_id))
    role = res.scalars().first()
    if not role:
        raise HTTPException(status_code=404, detail="Role not found.")
        
    if payload.permission_ids:
        perm_res = await db.execute(select(Permission).where(Permission.id.in_(payload.permission_ids)))
        found_perms = perm_res.scalars().all()
        if len(found_perms) != len(payload.permission_ids):
            raise HTTPException(status_code=400, detail="One or more invalid permission IDs provided.")
            
    from sqlalchemy import delete
    await db.execute(delete(role_permissions).where(role_permissions.c.role_id == role_id))
    
    if payload.permission_ids:
        for perm_id in payload.permission_ids:
            await db.execute(role_permissions.insert().values(role_id=role_id, permission_id=perm_id))
            
    await db.commit()
    return {"status": "success", "message": "Role permissions overwritten successfully."}

@router.put("/users/{user_id}/roles")
async def promote_user(
    user_id: uuid.UUID,
    payload: UserRoleUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    user_permissions = getattr(current_user, "permissions", [])
    if "*:*" not in user_permissions and "user:update" not in user_permissions and "iam:manage" not in user_permissions:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Forbidden: Requires user:update or iam:manage permission."
        )
        
    res = await db.execute(select(User).where(User.id == user_id))
    user = res.scalars().first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")
        
    role_res = await db.execute(select(Role).where(Role.id == payload.role_id))
    role = role_res.scalars().first()
    if not role:
        raise HTTPException(status_code=400, detail="Role not found.")
        
    from sqlalchemy import delete
    await db.execute(delete(user_roles).where(user_roles.c.user_id == user.id))
    await db.execute(user_roles.insert().values(user_id=user.id, role_id=role.id))
    await db.commit()
    return {"status": "success", "message": "User role updated successfully."}
