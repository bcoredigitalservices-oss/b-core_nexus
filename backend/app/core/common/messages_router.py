import uuid
from typing import List, Literal
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload

from app.database import get_db
from app.core.auth.security import RequiresPermission, User
from app.models.message import Message, MessageMention, MessageReadReceipt
from app.core.common.schemas import MessageCreate, MessageRead, MessageMentionRead
from app.core.crm.shares_router import get_entity_record
from app.core.common.rls import check_ownership
from app.core.common.notifications import create_notification
from app.models.notification import NotificationType

router = APIRouter(prefix="/messages", tags=["Messages"])

EntityType = Literal["lead", "contact", "customer", "deal", "quotation", "sales_order"]

@router.post("/{entity_type}/{entity_id}", response_model=MessageRead, status_code=status.HTTP_201_CREATED)
async def create_message(
    entity_type: EntityType,
    entity_id: uuid.UUID,
    payload: MessageCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(RequiresPermission("crm:write"))  # general write perm needed
):
    # Verify entity access
    record = await get_entity_record(db, entity_type, entity_id)
    await check_ownership(record, current_user, db, entity_type, "write")
    
    # Create the message
    message = Message(
        entity_type=entity_type,
        entity_id=entity_id,
        sender_id=current_user.id,
        content=payload.content,
        attachment_url=payload.attachment_url,
        attachment_name=payload.attachment_name
    )
    db.add(message)
    await db.flush()
    
    # Process @mentions
    for user_id in payload.mentions:
        mention = MessageMention(
            message_id=message.id,
            mentioned_user_id=user_id,
            is_read=False
        )
        db.add(mention)
        
        # Fire notification for mentioned user
        await create_notification(
            db=db,
            user_id=user_id,
            title="You were mentioned",
            message=f"{current_user.first_name or current_user.email} mentioned you in a {entity_type} message.",
            notification_type=NotificationType.MENTION,
            entity_type=entity_type,
            entity_id=entity_id
        )
        
    await db.commit()
    
    # Reload with relations
    res = await db.execute(
        select(Message).where(Message.id == message.id).options(
            selectinload(Message.mentions),
            selectinload(Message.read_receipts)
        )
    )
    return res.scalars().first()


@router.get("/{entity_type}/{entity_id}", response_model=List[MessageRead])
async def list_messages(
    entity_type: EntityType,
    entity_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(RequiresPermission("crm:read"))
):
    record = await get_entity_record(db, entity_type, entity_id)
    await check_ownership(record, current_user, db, entity_type, "read")
    
    msg_res = await db.execute(
        select(Message)
        .where(Message.entity_type == entity_type, Message.entity_id == entity_id)
        .options(
            selectinload(Message.mentions),
            selectinload(Message.read_receipts)
        )
        .order_by(Message.created_at.asc())
    )
    return msg_res.scalars().all()


@router.post("/{message_id}/read", status_code=status.HTTP_204_NO_CONTENT)
async def mark_message_as_read(
    message_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(RequiresPermission("crm:read"))
):
    # Check if receipt already exists
    res = await db.execute(
        select(MessageReadReceipt)
        .where(
            MessageReadReceipt.message_id == message_id,
            MessageReadReceipt.user_id == current_user.id
        )
    )
    if res.scalars().first():
        return None # already marked
        
    # Mark mention as read if applicable
    mention_res = await db.execute(
        select(MessageMention)
        .where(
            MessageMention.message_id == message_id,
            MessageMention.mentioned_user_id == current_user.id
        )
    )
    mention = mention_res.scalars().first()
    if mention:
        mention.is_read = True
        
    # Add read receipt
    receipt = MessageReadReceipt(
        message_id=message_id,
        user_id=current_user.id
    )
    db.add(receipt)
    await db.commit()
    return None


@router.get("/mentions/unread", response_model=List[MessageMentionRead])
async def get_unread_mentions(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(RequiresPermission("crm:read"))
):
    """
    Returns all unread @mentions for the currently logged-in user.
    """
    res = await db.execute(
        select(MessageMention)
        .where(
            MessageMention.mentioned_user_id == current_user.id,
            MessageMention.is_read == False
        )
    )
    return res.scalars().all()
