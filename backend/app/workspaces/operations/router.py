from typing import Optional
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies.auth import require_workspace_access
from app.database import get_db

from app.workspaces.crm.models import Customer
from app.models.user import User
from app.workspaces.operations.models import Project, Task, ProjectStatus, TaskStatus, TaskPriority
from app.workspaces.operations.schemas import (
    ProjectCreate,
    ProjectResponse,
    PaginatedProjectsResponse,
    TaskCreate,
    TaskResponse,
    PaginatedTasksResponse,
)

router = APIRouter(
    prefix="/operations",
    tags=["Operations"],
    dependencies=[Depends(require_workspace_access("operations"))],
)

WORKSPACE_FEATURES = [
    "Project Management",
    "Task Allocation",
    "Resource Scheduling",
    "Milestone Tracking",
]


@router.get("/meta", summary="Operations Workspace Metadata")
async def get_operations_meta():
    """
    Returns the Operations workspace status and the list of features
    accessible through this module.
    """
    return {
        "workspace": "operations",
        "status": "initialized",
        "accessible_features": WORKSPACE_FEATURES,
    }


# ─── Project Endpoints ────────────────────────────────────────────────────────

@router.post(
    "/projects",
    response_model=ProjectResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new operations project",
)
async def create_project(
    payload: ProjectCreate,
    db: AsyncSession = Depends(get_db),
):
    """
    Register a new project in the operations workspace.
    Verifies that the associated CRM customer ID exists.
    """
    # Verify Customer exists
    cust_exists = await db.scalar(
        select(func.count(Customer.id)).where(Customer.id == payload.customer_id)
    )
    if not cust_exists:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="The specified Customer ID does not exist in CRM.",
        )

    project = Project(**payload.model_dump())
    db.add(project)
    await db.flush()
    await db.commit()
    await db.refresh(project)
    return project


@router.get(
    "/projects",
    response_model=PaginatedProjectsResponse,
    summary="List operations projects with pagination",
)
async def list_projects(
    page: int = Query(1, ge=1, description="Page index (1-based)"),
    page_size: int = Query(10, ge=1, le=100, description="Items per page"),
    status_filter: Optional[ProjectStatus] = Query(None, alias="status", description="Filter by status"),
    search: Optional[str] = Query(None, description="Search by project name"),
    db: AsyncSession = Depends(get_db),
):
    """
    Retrieve paginated list of operations projects with optional status and name filters.
    """
    stmt = select(Project)
    if status_filter:
        stmt = stmt.where(Project.status == status_filter)
    if search:
        stmt = stmt.where(Project.project_name.ilike(f"%{search}%"))

    # Count total
    count_stmt = select(func.count()).select_from(stmt.subquery())
    total = await db.scalar(count_stmt) or 0

    # Retrieve items
    offset = (page - 1) * page_size
    stmt = stmt.order_by(Project.project_name).offset(offset).limit(page_size)
    result = await db.execute(stmt)
    items = result.scalars().all()

    return {
        "items": items,
        "total": total,
        "page": page,
        "page_size": page_size,
    }


# ─── Task Endpoints ───────────────────────────────────────────────────────────

@router.post(
    "/tasks",
    response_model=TaskResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new task under a project",
)
async def create_task(
    payload: TaskCreate,
    db: AsyncSession = Depends(get_db),
):
    """
    Create a new task within a project.
    Verifies that the parent project exists, and if assigned, that the user ID exists.
    """
    # Verify Project exists
    proj_exists = await db.scalar(
        select(func.count(Project.id)).where(Project.id == payload.project_id)
    )
    if not proj_exists:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="The specified Project ID does not exist.",
        )

    # Verify Assigned User exists if provided
    if payload.assigned_user_id:
        user_exists = await db.scalar(
            select(func.count(User.id)).where(User.id == payload.assigned_user_id)
        )
        if not user_exists:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="The specified Assigned User ID does not exist.",
            )

    task = Task(**payload.model_dump())
    db.add(task)
    await db.flush()
    await db.commit()
    await db.refresh(task)
    return task


@router.get(
    "/tasks",
    response_model=PaginatedTasksResponse,
    summary="List tasks with pagination and filters",
)
async def list_tasks(
    page: int = Query(1, ge=1, description="Page index (1-based)"),
    page_size: int = Query(10, ge=1, le=100, description="Items per page"),
    project_id: Optional[UUID] = Query(None, description="Filter by parent Project ID"),
    assigned_user_id: Optional[UUID] = Query(None, description="Filter by Assigned User ID"),
    status_filter: Optional[TaskStatus] = Query(None, alias="status", description="Filter by status"),
    priority_filter: Optional[TaskPriority] = Query(None, alias="priority", description="Filter by priority"),
    db: AsyncSession = Depends(get_db),
):
    """
    Retrieve paginated tasks with filters for Project, Assigned User, Status, and Priority.
    """
    stmt = select(Task)
    if project_id:
        stmt = stmt.where(Task.project_id == project_id)
    if assigned_user_id:
        stmt = stmt.where(Task.assigned_user_id == assigned_user_id)
    if status_filter:
        stmt = stmt.where(Task.status == status_filter)
    if priority_filter:
        stmt = stmt.where(Task.priority == priority_filter)

    # Count total
    count_stmt = select(func.count()).select_from(stmt.subquery())
    total = await db.scalar(count_stmt) or 0

    # Retrieve items
    offset = (page - 1) * page_size
    stmt = stmt.order_by(Task.task_title).offset(offset).limit(page_size)
    result = await db.execute(stmt)
    items = result.scalars().all()

    return {
        "items": items,
        "total": total,
        "page": page,
        "page_size": page_size,
    }
