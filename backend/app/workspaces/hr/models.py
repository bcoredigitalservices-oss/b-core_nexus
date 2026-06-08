import enum
import uuid
from datetime import date
from decimal import Decimal

from sqlalchemy import (
    Date,
    Enum as SAEnum,
    ForeignKey,
    Numeric,
    String,
    UUID as SQLUUID,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import CoreModel


# ─── HR Enums ─────────────────────────────────────────────────────────────────

class EmploymentStatus(str, enum.Enum):
    ACTIVE     = "ACTIVE"
    ON_LEAVE   = "ON_LEAVE"
    TERMINATED = "TERMINATED"


class LeaveType(str, enum.Enum):
    SICK     = "SICK"
    VACATION = "VACATION"
    UNPAID   = "UNPAID"


class LeaveApprovalStatus(str, enum.Enum):
    PENDING  = "PENDING"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"


# ─── EmployeeRecord Model ──────────────────────────────────────────────────────

class EmployeeRecord(CoreModel):
    """
    Employee Master File containing profile details, employment, and base salary structure.
    Can be optionally linked to an IAM login user_id.
    """
    __tablename__ = "hr_employee_records"

    user_id: Mapped[uuid.UUID | None] = mapped_column(
        SQLUUID(as_uuid=True),
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    first_name: Mapped[str] = mapped_column(String(100), nullable=False)
    last_name: Mapped[str] = mapped_column(String(100), nullable=False)
    job_title: Mapped[str] = mapped_column(String(150), nullable=False)
    hire_date: Mapped[date] = mapped_column(Date, nullable=False, index=True)
    base_salary: Mapped[Decimal] = mapped_column(Numeric(15, 4), nullable=False)
    employment_status: Mapped[EmploymentStatus] = mapped_column(
        SAEnum(EmploymentStatus, name="hr_employment_status", create_type=True),
        nullable=False,
        default=EmploymentStatus.ACTIVE,
    )

    # Relationships
    leave_requests: Mapped[list["LeaveRequest"]] = relationship(
        "LeaveRequest",
        back_populates="employee",
        cascade="all, delete-orphan",
    )


# ─── LeaveRequest Model ────────────────────────────────────────────────────────

class LeaveRequest(CoreModel):
    """
    Leave Application Registry mapping individual sick/vacation/unpaid periods per employee.
    """
    __tablename__ = "hr_leave_requests"

    employee_id: Mapped[uuid.UUID] = mapped_column(
        SQLUUID(as_uuid=True),
        ForeignKey("hr_employee_records.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    leave_type: Mapped[LeaveType] = mapped_column(
        SAEnum(LeaveType, name="hr_leave_type", create_type=True),
        nullable=False,
    )
    start_date: Mapped[date] = mapped_column(Date, nullable=False)
    end_date: Mapped[date] = mapped_column(Date, nullable=False)
    approval_status: Mapped[LeaveApprovalStatus] = mapped_column(
        SAEnum(LeaveApprovalStatus, name="hr_leave_approval_status", create_type=True),
        nullable=False,
        default=LeaveApprovalStatus.PENDING,
    )

    # Relationships
    employee: Mapped["EmployeeRecord"] = relationship("EmployeeRecord", back_populates="leave_requests")
