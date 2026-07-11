import uuid
from datetime import datetime, date
from typing import Optional, Literal
from pydantic import BaseModel, ConfigDict

from app.models.tasks import TaskStatus, TaskPriority


class TaskBase(BaseModel):
    """Fields shared by read/update. owner_id is intentionally excluded here
    so it cannot be forged in create requests."""
    title: str
    description: Optional[str] = None
    status: str = TaskStatus.PENDING.value
    priority: str = TaskPriority.MEDIUM.value
    due_date: Optional[date] = None
    entity_type: Optional[str] = None
    entity_id: Optional[uuid.UUID] = None
    granted_access_level: Literal["read", "write"] = "read"


class TaskCreate(TaskBase):
    """owner_id here represents the assignee. The endpoint validates that
    this user exists before persisting the task."""
    assignee_id: uuid.UUID  # Renamed for clarity; maps to Task.owner_id in the endpoint


class TaskUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    status: Optional[str] = None
    priority: Optional[str] = None
    due_date: Optional[date] = None
    # owner_id intentionally excluded: reassigning tasks is a separate, privileged action


class TaskRead(TaskBase):
    id: uuid.UUID
    owner_id: uuid.UUID  # The assignee — read-only in output
    created_by_id: Optional[uuid.UUID] = None
    created_at: datetime
    updated_at: datetime
    model_config = ConfigDict(from_attributes=True)
