from datetime import date
from decimal import Decimal
from typing import Any, Dict, Optional
from uuid import UUID
from pydantic import BaseModel, Field, model_validator

from app.workspaces.finance.models import (
    AccountType, JournalEntryStatus, InvoiceStatus, PaymentStatus, 
    TransactionType, ClearanceStatus
)


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


# ─── Invoicing Schemas ────────────────────────────────────────────────────────

class InvoiceItemBase(BaseModel):
    description: str
    quantity: Decimal
    unit_price: Decimal
    tax_rate: Decimal = Decimal("0.0")

class InvoiceItemCreate(InvoiceItemBase):
    pass

class InvoiceItemUpdate(BaseModel):
    description: Optional[str] = None
    quantity: Optional[Decimal] = None
    unit_price: Optional[Decimal] = None
    tax_rate: Optional[Decimal] = None

class InvoiceItemResponse(InvoiceItemBase):
    id: UUID
    invoice_id: UUID
    line_total: Decimal

    model_config = {"from_attributes": True}


class InvoiceBase(BaseModel):
    invoice_number: str
    customer_id: UUID
    invoice_date: date
    due_date: date
    status: InvoiceStatus = InvoiceStatus.DRAFT

class InvoiceCreate(InvoiceBase):
    subtotal: Decimal = Decimal("0.0")
    tax_total: Decimal = Decimal("0.0")
    total_amount: Decimal = Decimal("0.0")
    amount_due: Decimal = Decimal("0.0")
    journal_entry_id: Optional[UUID] = None

    @model_validator(mode="after")
    def validate_totals(self) -> "InvoiceCreate":
        if self.total_amount != self.subtotal + self.tax_total:
            raise ValueError("Total amount must equal subtotal plus tax total.")
        if self.amount_due > self.total_amount:
            raise ValueError("Amount due cannot exceed total amount.")
        return self

class InvoiceUpdate(BaseModel):
    status: Optional[InvoiceStatus] = None
    amount_due: Optional[Decimal] = None

class InvoiceResponse(InvoiceBase):
    id: UUID
    subtotal: Decimal
    tax_total: Decimal
    total_amount: Decimal
    amount_due: Decimal
    journal_entry_id: Optional[UUID]

    model_config = {"from_attributes": True}


# ─── Payments Schemas ─────────────────────────────────────────────────────────

class PaymentBase(BaseModel):
    payment_reference: str
    payment_date: date
    amount: Decimal
    payment_method: str
    status: PaymentStatus = PaymentStatus.PENDING
    journal_entry_id: Optional[UUID] = None

class PaymentCreate(PaymentBase):
    @model_validator(mode="after")
    def validate_amount(self) -> "PaymentCreate":
        if self.amount <= 0:
            raise ValueError("Payment amount must be greater than zero.")
        return self

class PaymentUpdate(BaseModel):
    status: Optional[PaymentStatus] = None

class PaymentResponse(PaymentBase):
    id: UUID

    model_config = {"from_attributes": True}


class PaymentReconciliationBase(BaseModel):
    payment_id: UUID
    invoice_id: UUID
    amount_applied: Decimal
    reconciliation_date: date

class PaymentReconciliationCreate(PaymentReconciliationBase):
    invoice_amount_due: Decimal

    @model_validator(mode="after")
    def validate_allocation(self) -> "PaymentReconciliationCreate":
        if self.amount_applied > self.invoice_amount_due:
            raise ValueError("Payment allocation cannot exceed the invoice amount due.")
        if self.amount_applied <= 0:
            raise ValueError("Amount applied must be strictly positive.")
        return self

class PaymentReconciliationUpdate(BaseModel):
    pass

class PaymentReconciliationResponse(PaymentReconciliationBase):
    id: UUID

    model_config = {"from_attributes": True}


# ─── Banking Schemas ──────────────────────────────────────────────────────────

class BankBase(BaseModel):
    bank_name: str
    swift_code: Optional[str] = None

class BankCreate(BankBase):
    pass

class BankUpdate(BaseModel):
    bank_name: Optional[str] = None
    swift_code: Optional[str] = None

class BankResponse(BankBase):
    id: UUID

    model_config = {"from_attributes": True}


class BankAccountBase(BaseModel):
    bank_id: UUID
    account_name: str
    account_number: str
    currency: str = "USD"
    linked_gl_account_id: Optional[UUID] = None

class BankAccountCreate(BankAccountBase):
    current_balance: Decimal = Decimal("0.0")

class BankAccountUpdate(BaseModel):
    account_name: Optional[str] = None
    current_balance: Optional[Decimal] = None

class BankAccountResponse(BankAccountBase):
    id: UUID
    current_balance: Decimal

    model_config = {"from_attributes": True}


class BankTransactionBase(BaseModel):
    bank_account_id: UUID
    transaction_date: date
    description: Optional[str] = None
    amount: Decimal
    transaction_type: TransactionType
    journal_entry_id: Optional[UUID] = None

class BankTransactionCreate(BankTransactionBase):
    @model_validator(mode="after")
    def validate_amount(self) -> "BankTransactionCreate":
        if self.amount <= 0:
            raise ValueError("Bank transaction amount must be greater than zero.")
        return self

class BankTransactionUpdate(BaseModel):
    description: Optional[str] = None

class BankTransactionResponse(BankTransactionBase):
    id: UUID

    model_config = {"from_attributes": True}


class BankClearanceBase(BaseModel):
    bank_transaction_id: UUID
    payment_id: Optional[UUID] = None
    clearance_date: Optional[date] = None
    status: ClearanceStatus = ClearanceStatus.PENDING

class BankClearanceCreate(BankClearanceBase):
    pass

class BankClearanceUpdate(BaseModel):
    clearance_date: Optional[date] = None
    status: Optional[ClearanceStatus] = None

class BankClearanceResponse(BankClearanceBase):
    id: UUID

    model_config = {"from_attributes": True}


# ─── Taxes Schemas ────────────────────────────────────────────────────────────

class TaxCategoryBase(BaseModel):
    name: str
    description: Optional[str] = None

class TaxCategoryCreate(TaxCategoryBase):
    pass

class TaxCategoryUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None

class TaxCategoryResponse(TaxCategoryBase):
    id: UUID

    model_config = {"from_attributes": True}


class TaxRuleBase(BaseModel):
    tax_category_id: UUID
    rate: Decimal
    effective_date: date
    region: Optional[str] = None

class TaxRuleCreate(TaxRuleBase):
    @model_validator(mode="after")
    def validate_rate(self) -> "TaxRuleCreate":
        if self.rate < 0 or self.rate > 1:
            raise ValueError("Tax rate must be between 0 and 1.")
        return self

class TaxRuleUpdate(BaseModel):
    rate: Optional[Decimal] = None
    effective_date: Optional[date] = None

class TaxRuleResponse(TaxRuleBase):
    id: UUID

    model_config = {"from_attributes": True}


class SalesTaxTemplateBase(BaseModel):
    name: str
    tax_rule_id: UUID

class SalesTaxTemplateCreate(SalesTaxTemplateBase):
    pass

class SalesTaxTemplateUpdate(BaseModel):
    name: Optional[str] = None

class SalesTaxTemplateResponse(SalesTaxTemplateBase):
    id: UUID

    model_config = {"from_attributes": True}


class PurchaseTaxTemplateBase(BaseModel):
    name: str
    tax_rule_id: UUID

class PurchaseTaxTemplateCreate(PurchaseTaxTemplateBase):
    pass

class PurchaseTaxTemplateUpdate(BaseModel):
    name: Optional[str] = None

class PurchaseTaxTemplateResponse(PurchaseTaxTemplateBase):
    id: UUID

    model_config = {"from_attributes": True}


# ─── Budgets Schemas ──────────────────────────────────────────────────────────

class BudgetBase(BaseModel):
    department: str
    fiscal_year: str
    total_allocation: Decimal
    amount_spent: Decimal = Decimal("0.0")
    status: str = "DRAFT"

class BudgetCreate(BudgetBase):
    @model_validator(mode="after")
    def validate_allocation(self) -> "BudgetCreate":
        if self.total_allocation <= 0:
            raise ValueError("Total allocation must be positive.")
        return self

class BudgetUpdate(BaseModel):
    total_allocation: Optional[Decimal] = None
    amount_spent: Optional[Decimal] = None
    status: Optional[str] = None

class BudgetResponse(BudgetBase):
    id: UUID

    model_config = {"from_attributes": True}


# ─── Share Management Schemas ─────────────────────────────────────────────────

class ShareholderBase(BaseModel):
    shareholder_name: str
    share_type: str
    total_shares: Decimal = Decimal("0")
    equity_value: Decimal = Decimal("0.0")
    status: str = "ACTIVE"

class ShareholderCreate(ShareholderBase):
    pass

class ShareholderUpdate(BaseModel):
    total_shares: Optional[Decimal] = None
    equity_value: Optional[Decimal] = None
    status: Optional[str] = None

class ShareholderResponse(ShareholderBase):
    id: UUID

    model_config = {"from_attributes": True}


class ShareTransferBase(BaseModel):
    shareholder_id: UUID
    transfer_date: date
    number_of_shares: Decimal
    price_per_share: Decimal
    journal_entry_id: Optional[UUID] = None
    status: str = "COMPLETED"

class ShareTransferCreate(ShareTransferBase):
    @model_validator(mode="after")
    def validate_shares(self) -> "ShareTransferCreate":
        if self.number_of_shares <= 0 or self.price_per_share <= 0:
            raise ValueError("Shares and price must be positive.")
        return self

class ShareTransferUpdate(BaseModel):
    status: Optional[str] = None

class ShareTransferResponse(ShareTransferBase):
    id: UUID

    model_config = {"from_attributes": True}
