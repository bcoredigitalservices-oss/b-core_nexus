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
from app.models.user import Role, user_roles, Permission, role_permissions
from app.models.organization import Organization, Department, DepartmentOut
from app.core.iam.email import send_onboarding_email

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

class UserProvision(BaseModel):
    email: str = Field(..., min_length=3)
    first_name: Optional[str] = None
    last_name: Optional[str] = None
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
        "organization_id": dept.organization_id
    }

# Workspaces creation endpoint removed

@router.post("/users/provision", status_code=status.HTTP_201_CREATED)
async def provision_user(
    payload: UserProvision,
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
        first_name=payload.first_name or "",
        last_name=payload.last_name or ""
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
        "role_tier": 4,
        "email_sent": email_dispatched
    }

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
        "role_tier": 4,
        "department_id": user.department_id,
        "functional_roles": []
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
