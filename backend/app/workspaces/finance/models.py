import enum
import uuid
from datetime import date
from decimal import Decimal

from sqlalchemy import (
    Boolean,
    Date,
    Enum as SAEnum,
    ForeignKey,
    Numeric,
    String,
    Text,
    UUID as SQLUUID,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import CoreModel


# ─── Finance Enums ────────────────────────────────────────────────────────────

class AccountType(str, enum.Enum):
    ASSET     = "ASSET"
    LIABILITY = "LIABILITY"
    EQUITY    = "EQUITY"
    REVENUE   = "REVENUE"
    EXPENSE   = "EXPENSE"


class JournalEntryStatus(str, enum.Enum):
    DRAFT  = "DRAFT"
    POSTED = "POSTED"


# ─── Account Model ────────────────────────────────────────────────────────────

class Account(CoreModel):
    """
    General Ledger Account.
    Represents an element in the Chart of Accounts (COA).
    """
    __tablename__ = "fin_accounts"

    account_code: Mapped[str] = mapped_column(String(100), unique=True, index=True, nullable=False)
    account_name: Mapped[str] = mapped_column(String(255), nullable=False)
    account_type: Mapped[AccountType] = mapped_column(
        SAEnum(AccountType, name="fin_account_type", create_type=True),
        nullable=False,
    )
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    # Relationships
    lines: Mapped[list["JournalEntryLine"]] = relationship("JournalEntryLine", back_populates="account")


# ─── Journal Entry Model ──────────────────────────────────────────────────────

class JournalEntry(CoreModel):
    """
    General Ledger Journal Entry.
    Contains metadata of a double-entry transaction block.
    """
    __tablename__ = "fin_journal_entries"

    entry_date: Mapped[date] = mapped_column(Date, nullable=False, index=True)
    description: Mapped[str] = mapped_column(String(500), nullable=True)
    reference_number: Mapped[str] = mapped_column(String(100), unique=True, index=True, nullable=False)
    status: Mapped[JournalEntryStatus] = mapped_column(
        SAEnum(JournalEntryStatus, name="fin_journal_entry_status", create_type=True),
        nullable=False,
        default=JournalEntryStatus.DRAFT,
    )

    # Relationships
    lines: Mapped[list["JournalEntryLine"]] = relationship(
        "JournalEntryLine",
        back_populates="journal_entry",
        cascade="all, delete-orphan",
    )


# ─── Journal Entry Line Model ─────────────────────────────────────────────────

class JournalEntryLine(CoreModel):
    """
    Detailed double-entry transactional debits/credits mapped to specific accounts.
    """
    __tablename__ = "fin_journal_entry_lines"

    journal_entry_id: Mapped[uuid.UUID] = mapped_column(
        SQLUUID(as_uuid=True),
        ForeignKey("fin_journal_entries.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    account_id: Mapped[uuid.UUID] = mapped_column(
        SQLUUID(as_uuid=True),
        ForeignKey("fin_accounts.id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )
    debit: Mapped[Decimal] = mapped_column(Numeric(15, 4), nullable=False, default=Decimal("0.0"))
    credit: Mapped[Decimal] = mapped_column(Numeric(15, 4), nullable=False, default=Decimal("0.0"))

    # Relationships
    journal_entry: Mapped["JournalEntry"] = relationship("JournalEntry", back_populates="lines")
    account: Mapped["Account"] = relationship("Account", back_populates="lines")
