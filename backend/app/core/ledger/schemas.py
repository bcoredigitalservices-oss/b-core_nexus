from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional
from decimal import Decimal
from datetime import datetime, timezone
from uuid import UUID

class LedgerEntryBase(BaseModel):
    account_or_location_code: str = Field(..., description="Account or warehouse location code")
    entity_id: Optional[UUID] = None
    item_id: Optional[UUID] = None
    quantity: Decimal = Field(default=Decimal("0.0000"), description="Quantity for balance tracking")
    amount: Decimal = Field(default=Decimal("0.0000"), description="Amount in currency")

class LedgerEntryCreate(LedgerEntryBase):
    pass

class LedgerEntryRead(LedgerEntryBase):
    id: UUID
    transaction_id: UUID

    class Config:
        from_attributes = True

class TransactionBase(BaseModel):
    transaction_number: str = Field(..., description="Globally unique transaction identifier")
    posted_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    workspace_source: str = Field(..., description="Workspace source of event (e.g. accounting)")
    description: str = Field(...)
    metadata_payload: Dict[str, Any] = Field(default_factory=dict)

class TransactionCreate(TransactionBase):
    entries: List[LedgerEntryCreate] = Field(..., min_length=1, description="Nested list of double-entry ledger entries")

class TransactionRead(TransactionBase):
    id: UUID
    entries: List[LedgerEntryRead]

    class Config:
        from_attributes = True
