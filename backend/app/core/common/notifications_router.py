import uuid
from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel, ConfigDict
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import update

from app.database import get_db
from app.core.auth.security import get_current_user, User
from app.models.notification import Notification

router = APIRouter(prefix="/notifications", tags=["Notifications"])

class NotificationRead(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    title: str
    message: str
    notification_type: str
    entity_type: Optional[str]
    entity_id: Optional[uuid.UUID]
    is_read: bool
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)

class NotificationCount(BaseModel):
    unread_count: int

@router.get("", response_model=List[NotificationRead])
async def list_notifications(
    unread_only: bool = Query(False, description="Filter to only unread notifications"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = select(Notification).where(Notification.user_id == current_user.id)
    if unread_only:
        query = query.where(Notification.is_read == False)
        
    query = query.order_by(Notification.created_at.desc())
    res = await db.execute(query)
    return res.scalars().all()

@router.get("/count", response_model=NotificationCount)
async def get_unread_count(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    res = await db.execute(
        select(Notification)
        .where(Notification.user_id == current_user.id, Notification.is_read == False)
    )
    count = len(res.scalars().all()) # using simple len since we assume notifications won't exceed millions per user, for true scale use func.count
    return {"unread_count": count}

@router.patch("/{notification_id}/read", status_code=status.HTTP_204_NO_CONTENT)
async def mark_notification_as_read(
    notification_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    await db.execute(
        update(Notification)
        .where(Notification.id == notification_id, Notification.user_id == current_user.id)
        .values(is_read=True)
    )
    await db.commit()

@router.post("/read-all", status_code=status.HTTP_204_NO_CONTENT)
async def mark_all_as_read(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    await db.execute(
        update(Notification)
        .where(Notification.user_id == current_user.id, Notification.is_read == False)
        .values(is_read=True)
    )
    await db.commit()
