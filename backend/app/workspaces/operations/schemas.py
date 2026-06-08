from datetime import date
from typing import Any, Dict, Optional
from uuid import UUID
from pydantic import BaseModel, Field, model_validator

from app.workspaces.operations.models import ProjectStatus, TaskStatus, TaskPriority


# ─── Project Schemas ──────────────────────────────────────────────────────────

class ProjectBase(BaseModel):
    project_name: str = Field(
        ...,
        min_length=1,
        max_length=255,
        description="Descriptive name of the operations project",
    )
    customer_id: UUID = Field(
        ...,
        description="Target customer organization ID from CRM",
    )
    status: ProjectStatus = Field(
        default=ProjectStatus.PLANNING,
        description="Lifecycle status of the project",
    )
    start_date: date = Field(
        ...,
        description="Official calendar start date",
    )
    target_end_date: date = Field(
        ...,
        description="Target completion date",
    )
    custom_attributes: Dict[str, Any] = Field(
        default_factory=dict,
        description="Dynamic metadata properties",
    )


class ProjectCreate(ProjectBase):
    @model_validator(mode="after")
    def validate_project_dates(self) -> "ProjectCreate":
        if self.start_date > self.target_end_date:
            raise ValueError("Project start date cannot be later than the target end date.")
        return self


class ProjectResponse(ProjectBase):
    id: UUID

    model_config = {"from_attributes": True}


class PaginatedProjectsResponse(BaseModel):
    items: list[ProjectResponse]
    total: int
    page: int
    page_size: int


# ─── Task Schemas ─────────────────────────────────────────────────────────────

class TaskBase(BaseModel):
    project_id: UUID = Field(
        ...,
        description="Parent operations project ID",
    )
    task_title: str = Field(
        ...,
        min_length=1,
        max_length=255,
        description="Title of the task",
    )
    assigned_user_id: Optional[UUID] = Field(
        default=None,
        description="Optional assignee user ID",
    )
    status: TaskStatus = Field(
        default=TaskStatus.TODO,
        description="Completion status of the task",
    )
    priority: TaskPriority = Field(
        default=TaskPriority.MEDIUM,
        description="Task priority classification",
    )
    custom_attributes: Dict[str, Any] = Field(
        default_factory=dict,
        description="Dynamic metadata properties",
    )


class TaskCreate(TaskBase):
    pass


class TaskResponse(TaskBase):
    id: UUID

    model_config = {"from_attributes": True}


class PaginatedTasksResponse(BaseModel):
    items: list[TaskResponse]
    total: int
    page: int
    page_size: int
