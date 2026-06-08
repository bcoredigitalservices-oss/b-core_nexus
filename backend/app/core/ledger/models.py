from sqlalchemy import String, Numeric, DateTime, ForeignKey, UUID as SQLUUID
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import CoreModel
from datetime import datetime, timezone
from decimal import Decimal
import uuid

# Import referenced models to ensure mapper initialization succeeds
from app.core.directory.models import Entity
from app.core.catalog.models import Item

class Transaction(CoreModel):
    __tablename__ = "transactions"

    transaction_number: Mapped[str] = mapped_column(String, unique=True, index=True, nullable=False)
    posted_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    workspace_source: Mapped[str] = mapped_column(String, nullable=False)
    description: Mapped[str] = mapped_column(String, nullable=False)
    metadata_payload: Mapped[dict] = mapped_column(JSONB, default=dict, nullable=False)

    entries = relationship("LedgerEntry", back_populates="transaction", cascade="all, delete-orphan")

class LedgerEntry(CoreModel):
    __tablename__ = "ledger_entries"

    transaction_id: Mapped[uuid.UUID] = mapped_column(SQLUUID(as_uuid=True), ForeignKey("transactions.id", ondelete="CASCADE"), nullable=False)
    account_or_location_code: Mapped[str] = mapped_column(String, index=True, nullable=False)
    entity_id: Mapped[uuid.UUID | None] = mapped_column(SQLUUID(as_uuid=True), ForeignKey("entities.id"), nullable=True)
    item_id: Mapped[uuid.UUID | None] = mapped_column(SQLUUID(as_uuid=True), ForeignKey("items.id"), nullable=True)
    quantity: Mapped[Decimal] = mapped_column(Numeric(precision=18, scale=4), default=Decimal("0.0000"), nullable=False)
    amount: Mapped[Decimal] = mapped_column(Numeric(precision=18, scale=4), default=Decimal("0.0000"), nullable=False)

    transaction = relationship("Transaction", back_populates="entries")
    entity = relationship("Entity")
    item = relationship("Item")
