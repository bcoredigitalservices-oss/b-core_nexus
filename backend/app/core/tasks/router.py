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

from app.core.common.rls import apply_ownership_filter, check_ownership
from app.core.common.notifications import create_notification
from app.models.notification import NotificationType

@router.post("", response_model=TaskRead, status_code=status.HTTP_201_CREATED)
async def create_task(
    payload: TaskCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(RequiresPermission("tasks:create"))
):
    from app.models.user import User as UserModel

    # Validate the assignee exists in the system
    assignee_res = await db.execute(select(UserModel).where(UserModel.id == payload.assignee_id, UserModel.is_active == True))
    if not assignee_res.scalars().first():
        raise HTTPException(status_code=404, detail="Assignee user not found or is inactive")

    # SECURITY: If the task links to an entity, the *creator* must have write access to that entity.
    # This prevents a non-owner from creating a task that grants themselves implicit entity access.
    if payload.entity_type and payload.entity_id:
        from app.core.crm.shares_router import get_entity_record
        try:
            record = await get_entity_record(db, payload.entity_type, payload.entity_id)
            await check_ownership(record, current_user, db, payload.entity_type, "write")
        except HTTPException:
            raise HTTPException(
                status_code=403,
                detail=f"You do not have write access to this {payload.entity_type} and cannot assign tasks for it."
            )

    task = Task(
        **payload.model_dump(exclude={"assignee_id"}),
        owner_id=payload.assignee_id,  # explicitly set from validated field
        created_by_id=current_user.id
    )
    db.add(task)
    await db.commit()
    await db.refresh(task)
    
    # Fire Notification
    await create_notification(
        db=db,
        user_id=task.owner_id,
        title="New Task Assigned",
        message=f"{current_user.first_name or current_user.email} assigned you a task: {task.title}",
        notification_type=NotificationType.TASK_ASSIGNED,
        entity_type="task",
        entity_id=task.id
    )
    
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
    query = apply_ownership_filter(query, current_user, Task, "task")
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
    await check_ownership(task, current_user, db, "task", "read")
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
    await check_ownership(task, current_user, db, "task", "write")
    
    for key, value in payload.model_dump(exclude_unset=True).items():
        setattr(task, key, value)
        
    await db.commit()
    await db.refresh(task)
    return task
