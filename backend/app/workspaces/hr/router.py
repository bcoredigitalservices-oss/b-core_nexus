from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies.auth import require_workspace_access
from app.database import get_db

from app.workspaces.hr.models import EmployeeRecord, EmploymentStatus
from app.workspaces.hr.schemas import (
    EmployeeCreate,
    EmployeeResponse,
    PaginatedEmployeesResponse,
)

router = APIRouter(
    prefix="/hr",
    tags=["HR"],
    dependencies=[Depends(require_workspace_access("hr"))],
)

WORKSPACE_FEATURES = [
    "Human Resources",
    "Payroll Management",
    "Attendance & Leave",
    "Recruitment",
    "Performance Management",
]


@router.get("/meta", summary="HR Workspace Metadata")
async def get_hr_meta():
    """
    Returns the HR workspace status and the list of features
    accessible through this module.
    """
    return {
        "workspace": "hr",
        "status": "initialized",
        "accessible_features": WORKSPACE_FEATURES,
    }


# ─── Employee Endpoints ───────────────────────────────────────────────────────

@router.post(
    "/employees",
    response_model=EmployeeResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Register a new employee record",
)
async def create_employee(
    payload: EmployeeCreate,
    db: AsyncSession = Depends(get_db),
):
    """
    Onboard and register a new employee record.
    Prevents duplicate IAM links if user_id is provided.
    """
    if payload.user_id:
        existing_res = await db.execute(
            select(EmployeeRecord).where(EmployeeRecord.user_id == payload.user_id)
        )
        if existing_res.scalars().first():
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="An employee record is already linked to this system user ID.",
            )

    employee = EmployeeRecord(**payload.model_dump())
    db.add(employee)
    
    # Secure database flush check before commit
    await db.flush()
    await db.commit()
    await db.refresh(employee)
    
    return employee


@router.get(
    "/employees",
    response_model=PaginatedEmployeesResponse,
    summary="List employee records with pagination and status filters",
)
async def list_employees(
    page: int = Query(1, ge=1, description="Page index (1-based)"),
    page_size: int = Query(10, ge=1, le=100, description="Items per page"),
    employment_status: Optional[EmploymentStatus] = Query(None, description="Filter by status"),
    search: Optional[str] = Query(None, description="Search term matching name or title"),
    db: AsyncSession = Depends(get_db),
):
    """
    Retrieves paginated employee master files with optional status filters and keyword search.
    """
    stmt = select(EmployeeRecord)

    # Apply filters
    if employment_status:
        stmt = stmt.where(EmployeeRecord.employment_status == employment_status)
    if search:
        search_filter = f"%{search}%"
        stmt = stmt.where(
            (EmployeeRecord.first_name.ilike(search_filter)) |
            (EmployeeRecord.last_name.ilike(search_filter)) |
            (EmployeeRecord.job_title.ilike(search_filter))
        )

    # Get total count
    count_stmt = select(func.count()).select_from(stmt.subquery())
    total_res = await db.execute(count_stmt)
    total = total_res.scalar_one()

    # Get paginated slice
    stmt = stmt.order_by(EmployeeRecord.last_name, EmployeeRecord.first_name)
    stmt = stmt.offset((page - 1) * page_size).limit(page_size)
    res = await db.execute(stmt)
    items = res.scalars().all()

    return PaginatedEmployeesResponse(
        items=items,
        total=total,
        page=page,
        page_size=page_size,
    )
