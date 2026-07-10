from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import or_
from app.core.auth.security import User
from app.models.crm import RecordShare
from app.models.tasks import Task

def apply_ownership_filter(query, current_user: User, model, entity_type: str):
    """
    Applies an RLS filter so users only see rows they own, OR rows shared with them,
    OR rows where they have an assigned task.
    """
    if "*:*" in current_user.permissions:
        return query
        
    
    conditions = [
        model.owner_id == current_user.id,
        # Explicitly shared via RecordShare
        model.id.in_(
            select(RecordShare.entity_id)
            .where(
                RecordShare.entity_type == entity_type,
                RecordShare.shared_with_user_id == current_user.id
            )
        )
    ]
    
    # Implicitly shared via Task assignment (skip if querying Tasks themselves)
    if entity_type != "task":
        conditions.append(
            model.id.in_(
                select(Task.entity_id)
                .where(
                    Task.entity_type == entity_type,
                    Task.owner_id == current_user.id
                )
            )
        )
        
    return query.where(or_(*conditions))

async def check_ownership(record, current_user: User, db: AsyncSession, entity_type: str, required_access: str = "read", require_true_owner: bool = False):
    """
    Checks if a user is allowed to access a specific record.
    Returns silently if access is allowed, raises 403 Forbidden otherwise.
    """
    if "*:*" in current_user.permissions:
        return
        
    # Owner always has access
    if getattr(record, "owner_id", None) == current_user.id:
        return
        
    if require_true_owner:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Forbidden: Only the true owner can perform this action."
        )
        
    # Check explicit shares
    share_query = select(RecordShare).where(
        RecordShare.entity_type == entity_type,
        RecordShare.entity_id == record.id,
        RecordShare.shared_with_user_id == current_user.id
    )
    if required_access == "write":
        share_query = share_query.where(RecordShare.access_level == "write")
        
    share_res = await db.execute(share_query)
    if share_res.scalars().first():
        return
        
    # Check task-based implicit shares
    task_query = select(Task).where(
        Task.entity_type == entity_type,
        Task.entity_id == record.id,
        Task.owner_id == current_user.id
    )
    if required_access == "write":
        task_query = task_query.where(Task.granted_access_level == "write")
        
    task_res = await db.execute(task_query)
    if task_res.scalars().first():
        return
        
    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail="Forbidden: You do not have sufficient access to this record."
    )
