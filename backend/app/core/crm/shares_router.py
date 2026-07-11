import uuid
from typing import Literal
from pydantic import BaseModel
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.database import get_db
from app.core.auth.security import RequiresPermission, User
from app.models.crm import RecordShare
from app.models.user import User as UserModel
from app.core.common.rls import check_ownership
from app.models.crm import Lead, Contact, Customer, Deal
from app.models.sales import Quotation, SalesOrder

router = APIRouter(prefix="/share", tags=["Shares"])

class ShareRequest(BaseModel):
    entity_type: Literal["lead", "contact", "customer", "quotation", "sales_order", "deal"]
    entity_id: uuid.UUID
    shared_with_user_id: uuid.UUID
    access_level: Literal["read", "write"] = "read"

class ShareResponse(BaseModel):
    id: uuid.UUID
    entity_type: str
    entity_id: uuid.UUID
    shared_with_user_id: uuid.UUID
    access_level: str

async def get_entity_record(db: AsyncSession, entity_type: str, entity_id: uuid.UUID):
    models = {
        "lead": Lead,
        "contact": Contact,
        "customer": Customer,
        "quotation": Quotation,
        "sales_order": SalesOrder,
        "deal": Deal
    }
    model = models.get(entity_type)
    if not model:
        raise HTTPException(400, "Invalid entity type")
    
    res = await db.execute(select(model).where(model.id == entity_id))
    record = res.scalars().first()
    if not record:
        raise HTTPException(404, "Record not found")
    return record

@router.post("", response_model=ShareResponse, status_code=status.HTTP_201_CREATED)
async def share_record(
    payload: ShareRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(RequiresPermission("crm:write"))
):
    """
    Shares a record with another user.
    Only the true owner of the record (or a super admin) can share it.
    """
    record = await get_entity_record(db, payload.entity_type, payload.entity_id)

    # Must be true owner to share
    if "*:*" not in current_user.permissions and getattr(record, "owner_id", None) != current_user.id:
        raise HTTPException(403, "Only the owner can share this record")

    # Validate the target user exists and is active
    target_user_res = await db.execute(
        select(UserModel).where(UserModel.id == payload.shared_with_user_id, UserModel.is_active == True)
    )
    if not target_user_res.scalars().first():
        raise HTTPException(status_code=404, detail="Target user not found or is inactive")

    # Prevent sharing with yourself
    if payload.shared_with_user_id == current_user.id:
        raise HTTPException(status_code=400, detail="You cannot share a record with yourself")

    # Check if share already exists
    share_res = await db.execute(
        select(RecordShare).where(
            RecordShare.entity_type == payload.entity_type,
            RecordShare.entity_id == payload.entity_id,
            RecordShare.shared_with_user_id == payload.shared_with_user_id
        )
    )
    share = share_res.scalars().first()

    if share:
        # Update existing share access level
        share.access_level = payload.access_level
    else:
        share = RecordShare(
            entity_type=payload.entity_type,
            entity_id=payload.entity_id,
            shared_with_user_id=payload.shared_with_user_id,
            shared_by_user_id=current_user.id,
            access_level=payload.access_level
        )
        db.add(share)

    await db.commit()
    await db.refresh(share)
    return share

@router.delete("/{share_id}", status_code=status.HTTP_204_NO_CONTENT)
async def revoke_share(
    share_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(RequiresPermission("crm:write"))
):
    share_res = await db.execute(select(RecordShare).where(RecordShare.id == share_id))
    share = share_res.scalars().first()
    if not share:
        raise HTTPException(404, "Share not found")
        
    record = await get_entity_record(db, share.entity_type, share.entity_id)
    if "*:*" not in current_user.permissions and getattr(record, "owner_id", None) != current_user.id:
        raise HTTPException(403, "Only the owner can revoke shares")
        
    await db.delete(share)
    await db.commit()
