import uuid
from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, ConfigDict

class MessageMentionBase(BaseModel):
    mentioned_user_id: uuid.UUID

class MessageMentionRead(MessageMentionBase):
    id: uuid.UUID
    message_id: uuid.UUID
    is_read: bool
    model_config = ConfigDict(from_attributes=True)

class MessageReadReceiptRead(BaseModel):
    id: uuid.UUID
    message_id: uuid.UUID
    user_id: uuid.UUID
    read_at: datetime
    model_config = ConfigDict(from_attributes=True)

class MessageBase(BaseModel):
    content: str
    attachment_url: Optional[str] = None
    attachment_name: Optional[str] = None

class MessageCreate(MessageBase):
    mentions: List[uuid.UUID] = []

class MessageUpdate(BaseModel):
    content: Optional[str] = None
    attachment_url: Optional[str] = None
    attachment_name: Optional[str] = None

class MessageRead(MessageBase):
    id: uuid.UUID
    entity_type: str
    entity_id: uuid.UUID
    sender_id: uuid.UUID
    created_at: datetime
    updated_at: Optional[datetime] = None
    mentions: List[MessageMentionRead] = []
    read_receipts: List[MessageReadReceiptRead] = []
    model_config = ConfigDict(from_attributes=True)
