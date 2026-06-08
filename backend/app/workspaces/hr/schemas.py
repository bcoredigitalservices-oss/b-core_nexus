from datetime import date, datetime
from decimal import Decimal
from typing import Any, Dict, Optional
from uuid import UUID
from pydantic import BaseModel, Field, model_validator

from app.workspaces.hr.models import EmploymentStatus, LeaveApprovalStatus, LeaveType


# ─── Employee Schemas ─────────────────────────────────────────────────────────

class EmployeeBase(BaseModel):
    user_id: Optional[UUID] = Field(
        default=None,
        description="Optional link to their core B-Core user/operator profile",
    )
    first_name: str = Field(
        ...,
        min_length=1,
        max_length=100,
        description="Legal first name of the employee",
    )
    last_name: str = Field(
        ...,
        min_length=1,
        max_length=100,
        description="Legal last name of the employee",
    )
    job_title: str = Field(
        ...,
        min_length=1,
        max_length=150,
        description="Corporate role or designation title",
    )
    hire_date: date = Field(
        ...,
        description="Calendar date of official onboarding/hire",
    )
    base_salary: Decimal = Field(
        ...,
        gt=Decimal("0.0"),
        description="Base salary amount (must be positive)",
    )
    employment_status: EmploymentStatus = Field(
        default=EmploymentStatus.ACTIVE,
        description="Staff lifecycle status: ACTIVE, ON_LEAVE, TERMINATED",
    )
    custom_attributes: Dict[str, Any] = Field(
        default_factory=dict,
        description="Dynamic JSON metadata properties",
    )


class EmployeeCreate(EmployeeBase):
    pass


class EmployeeResponse(EmployeeBase):
    id: UUID
    created_at: datetime

    model_config = {"from_attributes": True}


class PaginatedEmployeesResponse(BaseModel):
    items: list[EmployeeResponse]
    total: int
    page: int
    page_size: int


# ─── Leave Request Schemas ────────────────────────────────────────────────────

class LeaveRequestBase(BaseModel):
    employee_id: UUID = Field(
        ...,
        description="Target employee record ID",
    )
    leave_type: LeaveType = Field(
        ...,
        description="Classification of leave being requested: SICK, VACATION, UNPAID",
    )
    start_date: date = Field(
        ...,
        description="Beginning calendar date of the requested leave period",
    )
    end_date: date = Field(
        ...,
        description="Ending calendar date of the requested leave period",
    )
    approval_status: LeaveApprovalStatus = Field(
        default=LeaveApprovalStatus.PENDING,
        description="Approval state of the request: PENDING, APPROVED, REJECTED",
    )
    custom_attributes: Dict[str, Any] = Field(
        default_factory=dict,
        description="Dynamic JSON metadata properties",
    )


class LeaveRequestCreate(LeaveRequestBase):
    @model_validator(mode="after")
    def validate_date_range(self) -> "LeaveRequestCreate":
        if self.start_date > self.end_date:
            raise ValueError("Leave start date cannot be later than the end date.")
        return self


class LeaveRequestResponse(LeaveRequestBase):
    id: UUID
    created_at: datetime

    model_config = {"from_attributes": True}
