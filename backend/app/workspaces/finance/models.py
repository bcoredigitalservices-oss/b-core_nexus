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


# ─── Finance Additional Enums ─────────────────────────────────────────────────

class InvoiceStatus(str, enum.Enum):
    DRAFT = "DRAFT"
    ISSUED = "ISSUED"
    PARTIALLY_PAID = "PARTIALLY_PAID"
    PAID = "PAID"
    CANCELLED = "CANCELLED"

class PaymentStatus(str, enum.Enum):
    PENDING = "PENDING"
    COMPLETED = "COMPLETED"
    FAILED = "FAILED"

class TransactionType(str, enum.Enum):
    DEPOSIT = "DEPOSIT"
    WITHDRAWAL = "WITHDRAWAL"
    FEE = "FEE"

class ClearanceStatus(str, enum.Enum):
    PENDING = "PENDING"
    CLEARED = "CLEARED"
    BOUNCED = "BOUNCED"


# ─── Invoicing ────────────────────────────────────────────────────────────────

class Invoice(CoreModel):
    __tablename__ = "fin_invoices"

    invoice_number: Mapped[str] = mapped_column(String(100), unique=True, index=True, nullable=False)
    customer_id: Mapped[uuid.UUID] = mapped_column(SQLUUID(as_uuid=True), nullable=False)
    invoice_date: Mapped[date] = mapped_column(Date, nullable=False)
    due_date: Mapped[date] = mapped_column(Date, nullable=False)
    status: Mapped[InvoiceStatus] = mapped_column(
        SAEnum(InvoiceStatus, name="fin_invoice_status", create_type=True), nullable=False, default=InvoiceStatus.DRAFT
    )
    subtotal: Mapped[Decimal] = mapped_column(Numeric(15, 4), default=Decimal("0.0"))
    tax_total: Mapped[Decimal] = mapped_column(Numeric(15, 4), default=Decimal("0.0"))
    total_amount: Mapped[Decimal] = mapped_column(Numeric(15, 4), default=Decimal("0.0"))
    amount_due: Mapped[Decimal] = mapped_column(Numeric(15, 4), default=Decimal("0.0"))
    journal_entry_id: Mapped[uuid.UUID | None] = mapped_column(
        SQLUUID(as_uuid=True), ForeignKey("fin_journal_entries.id", ondelete="SET NULL"), nullable=True
    )

    items: Mapped[list["InvoiceItem"]] = relationship("InvoiceItem", back_populates="invoice")
    reconciliations: Mapped[list["PaymentReconciliation"]] = relationship("PaymentReconciliation", back_populates="invoice")


class InvoiceItem(CoreModel):
    __tablename__ = "fin_invoice_items"

    invoice_id: Mapped[uuid.UUID] = mapped_column(SQLUUID(as_uuid=True), ForeignKey("fin_invoices.id", ondelete="CASCADE"), nullable=False)
    description: Mapped[str] = mapped_column(String(500), nullable=False)
    quantity: Mapped[Decimal] = mapped_column(Numeric(15, 4), nullable=False, default=Decimal("1.0"))
    unit_price: Mapped[Decimal] = mapped_column(Numeric(15, 4), nullable=False)
    tax_rate: Mapped[Decimal] = mapped_column(Numeric(5, 4), default=Decimal("0.0"))
    line_total: Mapped[Decimal] = mapped_column(Numeric(15, 4), nullable=False)

    invoice: Mapped["Invoice"] = relationship("Invoice", back_populates="items")


# ─── Payments ─────────────────────────────────────────────────────────────────

class Payment(CoreModel):
    __tablename__ = "fin_payments"

    payment_reference: Mapped[str] = mapped_column(String(100), unique=True, nullable=False)
    payment_date: Mapped[date] = mapped_column(Date, nullable=False)
    amount: Mapped[Decimal] = mapped_column(Numeric(15, 4), nullable=False)
    payment_method: Mapped[str] = mapped_column(String(50), nullable=False)
    status: Mapped[PaymentStatus] = mapped_column(
        SAEnum(PaymentStatus, name="fin_payment_status", create_type=True), nullable=False, default=PaymentStatus.PENDING
    )
    journal_entry_id: Mapped[uuid.UUID | None] = mapped_column(
        SQLUUID(as_uuid=True), ForeignKey("fin_journal_entries.id", ondelete="SET NULL"), nullable=True
    )

    reconciliations: Mapped[list["PaymentReconciliation"]] = relationship("PaymentReconciliation", back_populates="payment")


class PaymentReconciliation(CoreModel):
    __tablename__ = "fin_payment_reconciliations"

    payment_id: Mapped[uuid.UUID] = mapped_column(SQLUUID(as_uuid=True), ForeignKey("fin_payments.id", ondelete="CASCADE"), nullable=False)
    invoice_id: Mapped[uuid.UUID] = mapped_column(SQLUUID(as_uuid=True), ForeignKey("fin_invoices.id", ondelete="CASCADE"), nullable=False)
    amount_applied: Mapped[Decimal] = mapped_column(Numeric(15, 4), nullable=False)
    reconciliation_date: Mapped[date] = mapped_column(Date, nullable=False)

    payment: Mapped["Payment"] = relationship("Payment", back_populates="reconciliations")
    invoice: Mapped["Invoice"] = relationship("Invoice", back_populates="reconciliations")


# ─── Banking ──────────────────────────────────────────────────────────────────

class Bank(CoreModel):
    __tablename__ = "fin_banks"

    bank_name: Mapped[str] = mapped_column(String(255), nullable=False)
    swift_code: Mapped[str] = mapped_column(String(50), nullable=True)

    accounts: Mapped[list["BankAccount"]] = relationship("BankAccount", back_populates="bank")


class BankAccount(CoreModel):
    __tablename__ = "fin_bank_accounts"

    bank_id: Mapped[uuid.UUID] = mapped_column(SQLUUID(as_uuid=True), ForeignKey("fin_banks.id", ondelete="CASCADE"), nullable=False)
    account_name: Mapped[str] = mapped_column(String(255), nullable=False)
    account_number: Mapped[str] = mapped_column(String(100), unique=True, nullable=False)
    currency: Mapped[str] = mapped_column(String(10), nullable=False, default="USD")
    current_balance: Mapped[Decimal] = mapped_column(Numeric(15, 4), default=Decimal("0.0"))
    linked_gl_account_id: Mapped[uuid.UUID | None] = mapped_column(
        SQLUUID(as_uuid=True), ForeignKey("fin_accounts.id", ondelete="SET NULL"), nullable=True
    )

    bank: Mapped["Bank"] = relationship("Bank", back_populates="accounts")
    transactions: Mapped[list["BankTransaction"]] = relationship("BankTransaction", back_populates="bank_account")


class BankTransaction(CoreModel):
    __tablename__ = "fin_bank_transactions"

    bank_account_id: Mapped[uuid.UUID] = mapped_column(SQLUUID(as_uuid=True), ForeignKey("fin_bank_accounts.id", ondelete="CASCADE"), nullable=False)
    transaction_date: Mapped[date] = mapped_column(Date, nullable=False)
    description: Mapped[str] = mapped_column(String(500), nullable=True)
    amount: Mapped[Decimal] = mapped_column(Numeric(15, 4), nullable=False)
    transaction_type: Mapped[TransactionType] = mapped_column(
        SAEnum(TransactionType, name="fin_transaction_type", create_type=True), nullable=False
    )
    journal_entry_id: Mapped[uuid.UUID | None] = mapped_column(
        SQLUUID(as_uuid=True), ForeignKey("fin_journal_entries.id", ondelete="SET NULL"), nullable=True
    )

    bank_account: Mapped["BankAccount"] = relationship("BankAccount", back_populates="transactions")


class BankClearance(CoreModel):
    __tablename__ = "fin_bank_clearance"

    bank_transaction_id: Mapped[uuid.UUID] = mapped_column(
        SQLUUID(as_uuid=True), ForeignKey("fin_bank_transactions.id", ondelete="CASCADE"), nullable=False
    )
    payment_id: Mapped[uuid.UUID | None] = mapped_column(
        SQLUUID(as_uuid=True), ForeignKey("fin_payments.id", ondelete="SET NULL"), nullable=True
    )
    clearance_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    status: Mapped[ClearanceStatus] = mapped_column(
        SAEnum(ClearanceStatus, name="fin_clearance_status", create_type=True), nullable=False, default=ClearanceStatus.PENDING
    )


# ─── Taxes ────────────────────────────────────────────────────────────────────

class TaxCategory(CoreModel):
    __tablename__ = "fin_tax_categories"

    name: Mapped[str] = mapped_column(String(100), unique=True, nullable=False)
    description: Mapped[str] = mapped_column(String(500), nullable=True)


class TaxRule(CoreModel):
    __tablename__ = "fin_tax_rules"

    tax_category_id: Mapped[uuid.UUID] = mapped_column(
        SQLUUID(as_uuid=True), ForeignKey("fin_tax_categories.id", ondelete="CASCADE"), nullable=False
    )
    rate: Mapped[Decimal] = mapped_column(Numeric(5, 4), nullable=False)
    effective_date: Mapped[date] = mapped_column(Date, nullable=False)
    region: Mapped[str] = mapped_column(String(100), nullable=True)


class SalesTaxTemplate(CoreModel):
    __tablename__ = "fin_sales_tax_templates"

    name: Mapped[str] = mapped_column(String(100), unique=True, nullable=False)
    tax_rule_id: Mapped[uuid.UUID] = mapped_column(
        SQLUUID(as_uuid=True), ForeignKey("fin_tax_rules.id", ondelete="RESTRICT"), nullable=False
    )


class PurchaseTaxTemplate(CoreModel):
    __tablename__ = "fin_purchase_tax_templates"

    name: Mapped[str] = mapped_column(String(100), unique=True, nullable=False)
    tax_rule_id: Mapped[uuid.UUID] = mapped_column(
        SQLUUID(as_uuid=True), ForeignKey("fin_tax_rules.id", ondelete="RESTRICT"), nullable=False
    )


# ─── Budgets ──────────────────────────────────────────────────────────────────

class Budget(CoreModel):
    __tablename__ = "fin_budgets"

    department: Mapped[str] = mapped_column(String(255), nullable=False)
    fiscal_year: Mapped[str] = mapped_column(String(20), nullable=False)
    total_allocation: Mapped[Decimal] = mapped_column(Numeric(15, 4), nullable=False)
    amount_spent: Mapped[Decimal] = mapped_column(Numeric(15, 4), default=Decimal("0.0"))
    status: Mapped[str] = mapped_column(String(50), default="DRAFT")


# ─── Share Management ─────────────────────────────────────────────────────────

class Shareholder(CoreModel):
    __tablename__ = "fin_shareholders"

    shareholder_name: Mapped[str] = mapped_column(String(255), nullable=False)
    share_type: Mapped[str] = mapped_column(String(100), nullable=False)
    total_shares: Mapped[Decimal] = mapped_column(Numeric(15, 0), default=Decimal("0"))
    equity_value: Mapped[Decimal] = mapped_column(Numeric(15, 4), default=Decimal("0.0"))
    status: Mapped[str] = mapped_column(String(50), default="ACTIVE")


class ShareTransfer(CoreModel):
    __tablename__ = "fin_share_transfers"

    shareholder_id: Mapped[uuid.UUID] = mapped_column(
        SQLUUID(as_uuid=True), ForeignKey("fin_shareholders.id", ondelete="CASCADE"), nullable=False
    )
    transfer_date: Mapped[date] = mapped_column(Date, nullable=False)
    number_of_shares: Mapped[Decimal] = mapped_column(Numeric(15, 0), nullable=False)
    price_per_share: Mapped[Decimal] = mapped_column(Numeric(15, 4), nullable=False)
    journal_entry_id: Mapped[uuid.UUID | None] = mapped_column(
        SQLUUID(as_uuid=True), ForeignKey("fin_journal_entries.id", ondelete="SET NULL"), nullable=True
    )
    status: Mapped[str] = mapped_column(String(50), default="COMPLETED")

    shareholder: Mapped["Shareholder"] = relationship("Shareholder")
