import enum
import uuid
from datetime import date

from sqlalchemy import (
    Date,
    Enum as SAEnum,
    ForeignKey,
    String,
    UUID as SQLUUID,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import CoreModel


# ─── Operations Enums ──────────────────────────────────────────────────────────

class ProjectStatus(str, enum.Enum):
    PLANNING  = "PLANNING"
    ACTIVE    = "ACTIVE"
    ON_HOLD   = "ON_HOLD"
    COMPLETED = "COMPLETED"


class TaskStatus(str, enum.Enum):
    TODO        = "TODO"
    IN_PROGRESS = "IN_PROGRESS"
    REVIEW      = "REVIEW"
    DONE        = "DONE"


class TaskPriority(str, enum.Enum):
    LOW    = "LOW"
    MEDIUM = "MEDIUM"
    HIGH   = "HIGH"
    URGENT = "URGENT"


# ─── Project Model ────────────────────────────────────────────────────────────

class Project(CoreModel):
    """
    Operations Project tracking record, referencing customer coordinates from CRM.
    """
    __tablename__ = "ops_projects"

    project_name: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    customer_id: Mapped[uuid.UUID] = mapped_column(
        SQLUUID(as_uuid=True),
        ForeignKey("crm_customers.id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )
    status: Mapped[ProjectStatus] = mapped_column(
        SAEnum(ProjectStatus, name="ops_project_status", create_type=True),
        nullable=False,
        default=ProjectStatus.PLANNING,
    )
    start_date: Mapped[date] = mapped_column(Date, nullable=False)
    target_end_date: Mapped[date] = mapped_column(Date, nullable=False)

    # Relationships
    tasks: Mapped[list["Task"]] = relationship(
        "Task",
        back_populates="project",
        cascade="all, delete-orphan",
    )


# ─── Task Model ───────────────────────────────────────────────────────────────

class Task(CoreModel):
    """
    Individual Task assigned within a Project, linking to an IAM User for accountability.
    """
    __tablename__ = "ops_tasks"

    project_id: Mapped[uuid.UUID] = mapped_column(
        SQLUUID(as_uuid=True),
        ForeignKey("ops_projects.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    task_title: Mapped[str] = mapped_column(String(255), nullable=False)
    assigned_user_id: Mapped[uuid.UUID | None] = mapped_column(
        SQLUUID(as_uuid=True),
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    status: Mapped[TaskStatus] = mapped_column(
        SAEnum(TaskStatus, name="ops_task_status", create_type=True),
        nullable=False,
        default=TaskStatus.TODO,
    )
    priority: Mapped[TaskPriority] = mapped_column(
        SAEnum(TaskPriority, name="ops_task_priority", create_type=True),
        nullable=False,
        default=TaskPriority.MEDIUM,
    )

    # Relationships
    project: Mapped["Project"] = relationship("Project", back_populates="tasks")
