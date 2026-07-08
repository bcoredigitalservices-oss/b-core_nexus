import uuid
from datetime import datetime, date
from typing import Optional
from pydantic import BaseModel, ConfigDict

from app.models.tasks import TaskStatus, TaskPriority

class TaskBase(BaseModel):
    title: str
    description: Optional[str] = None
    status: str = TaskStatus.PENDING.value
    priority: str = TaskPriority.MEDIUM.value
    due_date: Optional[date] = None
    entity_type: Optional[str] = None
    entity_id: Optional[uuid.UUID] = None
    owner_id: uuid.UUID

class TaskCreate(TaskBase):
    pass

class TaskUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    status: Optional[str] = None
    priority: Optional[str] = None
    due_date: Optional[date] = None
    owner_id: Optional[uuid.UUID] = None

class TaskRead(TaskBase):
    id: uuid.UUID
    created_by_id: Optional[uuid.UUID] = None
    created_at: datetime
    updated_at: datetime
    model_config = ConfigDict(from_attributes=True)
