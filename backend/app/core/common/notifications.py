import uuid
from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.notification import Notification, NotificationType

async def create_notification(
    db: AsyncSession,
    user_id: uuid.UUID,
    title: str,
    message: str,
    notification_type: NotificationType,
    entity_type: Optional[str] = None,
    entity_id: Optional[uuid.UUID] = None,
) -> Notification:
    """
    Creates a new system notification for a user.
    """
    notification = Notification(
        user_id=user_id,
        title=title,
        message=message,
        notification_type=notification_type.value,
        entity_type=entity_type,
        entity_id=entity_id
    )
    db.add(notification)
    await db.commit()
    await db.refresh(notification)
    return notification
