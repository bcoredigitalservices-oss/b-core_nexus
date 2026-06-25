import secrets
import uuid
from datetime import datetime, timezone, timedelta
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Request
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.database import get_db
from app.core.auth.router import get_current_user
from app.core.auth.models import User
from app.models.organization import Organization, Department, DepartmentOut
from app.models.workspace import Workspace
from app.core.iam.email import send_onboarding_email

router = APIRouter(prefix="/iam", tags=["Identity & Access Management (IAM)"])

# ── Dependency Guards ────────────────────────────────────────────────────────
def require_iam_privilege(current_user: User = Depends(get_current_user)):
    # Tier 0 (System Admin) and Tier 1 (Executive Admin) can manage IAM
    if current_user.role_tier not in [0, 1]:
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

class WorkspaceCreate(BaseModel):
    name: str = Field(..., min_length=1)
    identifier: str = Field(..., min_length=1)
    status: Optional[str] = "Active"
    organization_id: Optional[uuid.UUID] = None

class UserProvision(BaseModel):
    email: str = Field(..., min_length=3)
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    role_tier: int = Field(..., ge=2, le=4)
    designation: Optional[str] = None
    department_id: Optional[uuid.UUID] = None
    workspace_strings: List[str] = Field(default_factory=list)

class AccessUpdate(BaseModel):
    designation: Optional[str] = None
    workspace_ids: Optional[List[uuid.UUID]] = None
    role_tier: Optional[int] = Field(None, ge=2, le=4)
    department_id: Optional[uuid.UUID] = None
    functional_roles: Optional[List[str]] = None

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

@router.post("/workspaces", status_code=status.HTTP_201_CREATED)
async def create_workspace(
    payload: WorkspaceCreate,
    db: AsyncSession = Depends(get_db),
    _ = Depends(require_iam_privilege)
):
    org_id = payload.organization_id or await get_default_org_id(db)
    
    # Check duplicate identifier
    res = await db.execute(select(Workspace).where(Workspace.identifier == payload.identifier))
    if res.scalars().first():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Workspace identifier '{payload.identifier}' already registered."
        )
        
    ws = Workspace(
        organization_id=org_id,
        name=payload.name,
        identifier=payload.identifier,
        status=payload.status or "Active"
    )
    db.add(ws)
    await db.flush()
    await db.commit()
    await db.refresh(ws)
    
    return {
        "id": ws.id,
        "name": ws.name,
        "identifier": ws.identifier,
        "status": ws.status,
        "organization_id": ws.organization_id
    }

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
            
    # Resolve requested workspaces
    if payload.workspace_strings:
        for ws_str in payload.workspace_strings:
            res = await db.execute(select(Workspace).where(Workspace.identifier == ws_str))
            if not res.scalars().first():
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Workspace identifier '{ws_str}' not found."
                )
            
    # Generate 64-character invite token matching Phase 1 onboarding specs
    token = secrets.token_urlsafe(48)
    
    user = User(
        email=payload.email,
        first_name=payload.first_name,
        last_name=payload.last_name,
        role_tier=payload.role_tier,
        designation=payload.designation,
        department_id=payload.department_id,
        invite_token=token,
        token_expires_at=datetime.now(timezone.utc) + timedelta(hours=24),
        is_active=False,
        hashed_password=None,
        mfa_enabled=False
    )
    
    # Assign workspaces many-to-many relationship
    if payload.workspace_strings:
        user.workspaces = payload.workspace_strings
    
    db.add(user)
    await db.flush()
    await db.commit()
    await db.refresh(user)
    
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
        "user_id": user.id,
        "invite_token": token,
        "onboarding_url": onboarding_url,
        "designation": user.designation,
        "role_tier": user.role_tier,
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
    if payload.role_tier is not None:
        user.role_tier = payload.role_tier
    if payload.department_id is not None:
        user.department_id = payload.department_id
    if payload.functional_roles is not None:
        user.functional_roles = payload.functional_roles
        
    # Update many-to-many workspace assignments
    if payload.workspace_ids is not None:
        resolved_workspaces = []
        for ws_id in payload.workspace_ids:
            res = await db.execute(select(Workspace).where(Workspace.id == ws_id))
            ws = res.scalars().first()
            if not ws:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Workspace ID {ws_id} not found."
                )
            resolved_workspaces.append(ws)
        user.workspaces = [ws.identifier for ws in resolved_workspaces]
        
    db.add(user)
    await db.flush()
    await db.commit()
    await db.refresh(user)
    
    # Map workspace strings back to workspace IDs
    ws_ids = []
    if user.workspaces:
        for ws_str in user.workspaces:
            res = await db.execute(select(Workspace).where(Workspace.identifier == ws_str))
            ws = res.scalars().first()
            if ws:
                ws_ids.append(ws.id)
    
    return {
        "status": "success",
        "user_id": user.id,
        "designation": user.designation,
        "role_tier": user.role_tier,
        "workspace_ids": ws_ids,
        "department_id": user.department_id,
        "functional_roles": user.functional_roles
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

@router.get("/workspaces")
async def list_workspaces(
    db: AsyncSession = Depends(get_db),
    _ = Depends(require_iam_privilege)
):
    res = await db.execute(select(Workspace))
    wses = res.scalars().all()
    return [{
        "id": ws.id,
        "name": ws.name,
        "identifier": ws.identifier,
        "status": ws.status,
        "organization_id": ws.organization_id
    } for ws in wses]
