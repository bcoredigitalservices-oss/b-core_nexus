from datetime import date
from decimal import Decimal
from typing import Any, Dict, Optional
from uuid import UUID
from pydantic import BaseModel, Field, model_validator

from app.workspaces.finance.models import AccountType, JournalEntryStatus


# ─── Account Schemas ──────────────────────────────────────────────────────────

class AccountBase(BaseModel):
    account_code: str = Field(
        ...,
        min_length=1,
        max_length=100,
        description="Unique alphanumeric code identifying the account (e.g. '1000', '2100')",
    )
    account_name: str = Field(
        ...,
        min_length=1,
        max_length=255,
        description="Human readable name of the account",
    )
    account_type: AccountType = Field(
        ...,
        description="General classification type of the account",
    )
    is_active: bool = Field(
        default=True,
        description="Indicator of whether the account can accept new postings",
    )
    custom_attributes: Dict[str, Any] = Field(
        default_factory=dict,
        description="Dynamic JSON metadata attributes",
    )


class AccountCreate(AccountBase):
    pass


class AccountResponse(AccountBase):
    id: UUID

    model_config = {"from_attributes": True}


# ─── Journal Entry Line Schemas ───────────────────────────────────────────────

class JournalEntryLineBase(BaseModel):
    account_id: UUID = Field(
        ...,
        description="Target Account UUID",
    )
    debit: Decimal = Field(
        default=Decimal("0.0"),
        ge=Decimal("0.0"),
        description="Amount to debit from the account (must be >= 0)",
    )
    credit: Decimal = Field(
        default=Decimal("0.0"),
        ge=Decimal("0.0"),
        description="Amount to credit to the account (must be >= 0)",
    )
    custom_attributes: Dict[str, Any] = Field(
        default_factory=dict,
        description="Line-level custom JSON properties",
    )


class JournalEntryLineCreate(JournalEntryLineBase):
    pass


class JournalEntryLineResponse(JournalEntryLineBase):
    id: UUID

    model_config = {"from_attributes": True}


# ─── Journal Entry Schemas ────────────────────────────────────────────────────

class JournalEntryBase(BaseModel):
    entry_date: date = Field(
        ...,
        description="The calendar date of the transaction entry",
    )
    description: Optional[str] = Field(
        default=None,
        max_length=500,
        description="Narrative explanation of the transaction",
    )
    reference_number: str = Field(
        ...,
        min_length=1,
        max_length=100,
        description="Unique identifier referencing invoice, receipt, or transaction reference",
    )
    status: JournalEntryStatus = Field(
        default=JournalEntryStatus.DRAFT,
        description="Lifecycle status of the entry: DRAFT or POSTED",
    )
    custom_attributes: Dict[str, Any] = Field(
        default_factory=dict,
        description="Dynamic JSON metadata attributes",
    )


class JournalEntryCreate(JournalEntryBase):
    lines: list[JournalEntryLineCreate] = Field(
        ...,
        min_length=2,
        description="Array of transaction rows (must have at least 2 lines)",
    )

    @model_validator(mode="after")
    def validate_double_entry_balance(self) -> "JournalEntryCreate":
        """
        Enforce that sum(debit) == sum(credit) across the journal entry lines,
        and that the transaction amount is non-zero.
        """
        total_debit = sum(line.debit for line in self.lines)
        total_credit = sum(line.credit for line in self.lines)

        if total_debit != total_credit:
            raise ValueError(
                f"Double-entry validation failure: total debits ({total_debit}) must exactly equal total credits ({total_credit})."
            )

        if total_debit <= Decimal("0.0"):
            raise ValueError("Double-entry validation failure: transaction must have a positive, non-zero amount.")

        # Ensure both debit and credit are not populated on the same line
        for index, line in enumerate(self.lines):
            if line.debit > 0 and line.credit > 0:
                raise ValueError(
                    f"Validation failure at line {index + 1}: Line cannot specify both a debit and a credit value simultaneously."
                )
            if line.debit == 0 and line.credit == 0:
                raise ValueError(
                    f"Validation failure at line {index + 1}: Line must specify either a non-zero debit or credit."
                )

        return self


class JournalEntryResponse(JournalEntryBase):
    id: UUID
    lines: list[JournalEntryLineResponse]

    model_config = {"from_attributes": True}
