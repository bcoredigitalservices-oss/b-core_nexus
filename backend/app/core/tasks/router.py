import uuid
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.database import get_db
from app.core.auth.security import RequiresPermission, User
from app.models.tasks import Task
from app.core.tasks.schemas import TaskCreate, TaskUpdate, TaskRead

router = APIRouter(prefix="/tasks", tags=["Tasks"])

def apply_ownership_filter(query, current_user: User):
    if "*:*" not in current_user.permissions:
        return query.where(Task.owner_id == current_user.id)
    return query

def check_ownership(record, current_user: User):
    if "*:*" not in current_user.permissions and getattr(record, "owner_id", None) != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Forbidden: You do not own this record."
        )

@router.post("", response_model=TaskRead, status_code=status.HTTP_201_CREATED)
async def create_task(
    payload: TaskCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(RequiresPermission("tasks:create"))
):
    task = Task(
        **payload.model_dump(),
        created_by_id=current_user.id
    )
    db.add(task)
    await db.commit()
    await db.refresh(task)
    return task

@router.get("/my", response_model=List[TaskRead])
async def get_my_tasks(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(RequiresPermission("tasks:read"))
):
    """
    Returns tasks assigned to the currently logged in user.
    """
    res = await db.execute(
        select(Task)
        .where(Task.owner_id == current_user.id)
        .order_by(Task.due_date.asc().nulls_last())
    )
    return res.scalars().all()

@router.get("", response_model=List[TaskRead])
async def list_tasks(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(RequiresPermission("tasks:read"))
):
    query = select(Task).order_by(Task.due_date.asc().nulls_last())
    query = apply_ownership_filter(query, current_user)
    res = await db.execute(query)
    return res.scalars().all()

@router.get("/{task_id}", response_model=TaskRead)
async def get_task(
    task_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(RequiresPermission("tasks:read"))
):
    res = await db.execute(select(Task).where(Task.id == task_id))
    task = res.scalars().first()
    if not task:
        raise HTTPException(404, "Task not found")
    check_ownership(task, current_user)
    return task

@router.put("/{task_id}", response_model=TaskRead)
async def update_task(
    task_id: uuid.UUID,
    payload: TaskUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(RequiresPermission("tasks:write"))
):
    res = await db.execute(select(Task).where(Task.id == task_id))
    task = res.scalars().first()
    if not task:
        raise HTTPException(404, "Task not found")
    check_ownership(task, current_user)
    
    for key, value in payload.model_dump(exclude_unset=True).items():
        setattr(task, key, value)
        
    await db.commit()
    await db.refresh(task)
    return task
