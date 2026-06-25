import datetime
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.dependencies.auth import require_workspace_access
from app.database import get_db

from app.workspaces.finance.models import (
    Account, JournalEntry, JournalEntryLine, AccountType, JournalEntryStatus,
    Invoice, Payment, PaymentReconciliation, Bank, BankAccount,
    TaxCategory, TaxRule, SalesTaxTemplate,
    Budget, Shareholder, ShareTransfer
)
from app.workspaces.finance.schemas import (
    AccountCreate,
    AccountResponse,
    JournalEntryCreate,
    JournalEntryResponse,
)

router = APIRouter(
    prefix="/finance",
    tags=["Finance"],
    dependencies=[Depends(require_workspace_access("finance"))],
)

WORKSPACE_FEATURES = [
    "Financial Management",
    "Accounting",
    "Budgeting & Forecasting",
    "Expense Tracking",
    "Tax Compliance",
]


@router.get("/meta", summary="Finance Workspace Metadata")
async def get_finance_meta():
    """
    Returns the Finance workspace status and the list of features
    accessible through this module.
    """
    return {
        "workspace": "finance",
        "status": "initialized",
        "accessible_features": WORKSPACE_FEATURES,
    }


# ─── Account Endpoints ────────────────────────────────────────────────────────

@router.post(
    "/accounts",
    response_model=AccountResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Register a new General Ledger account",
)
async def create_account(
    payload: AccountCreate,
    db: AsyncSession = Depends(get_db),
):
    """
    Create a new account in the Chart of Accounts.
    Enforces uniqueness of the account_code.
    """
    # Check if account code already exists
    existing_res = await db.execute(
        select(Account).where(Account.account_code == payload.account_code)
    )
    if existing_res.scalars().first():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Account with code '{payload.account_code}' already exists.",
        )

    account = Account(**payload.model_dump())
    db.add(account)
    await db.flush()
    await db.commit()
    await db.refresh(account)
    return account


@router.get(
    "/accounts",
    response_model=list[AccountResponse],
    summary="List all Chart of Accounts entries",
)
async def list_accounts(
    db: AsyncSession = Depends(get_db),
):
    """
    List all Chart of Accounts entries sorted by account code.
    """
    result = await db.execute(select(Account).order_by(Account.account_code))
    return result.scalars().all()


# ─── Journal Entry Endpoints ──────────────────────────────────────────────────

@router.post(
    "/journal-entries",
    response_model=JournalEntryResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Post a balanced double-entry journal transaction",
)
async def create_journal_entry(
    payload: JournalEntryCreate,
    db: AsyncSession = Depends(get_db),
):
    """
    Creates a new JournalEntry alongside its transaction lines in a single transactional block.
    Enforces active account constraints and unique reference numbers.
    """
    # Check if reference number is unique
    existing_res = await db.execute(
        select(JournalEntry).where(JournalEntry.reference_number == payload.reference_number)
    )
    if existing_res.scalars().first():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Journal entry with reference number '{payload.reference_number}' already exists.",
        )

    # Validate that all targeted accounts are valid and active
    account_ids = {line.account_id for line in payload.lines}
    db_accounts_res = await db.execute(
        select(Account).where(Account.id.in_(account_ids), Account.is_active == True)
    )
    db_accounts = db_accounts_res.scalars().all()

    if len(db_accounts) != len(account_ids):
        found_ids = {acc.id for acc in db_accounts}
        missing_ids = account_ids - found_ids
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid or inactive account IDs: {', '.join(str(i) for i in missing_ids)}",
        )

    # Begin multi-table insert in atomic transaction
    entry_dict = payload.model_dump()
    lines_data = entry_dict.pop("lines")

    entry = JournalEntry(**entry_dict)
    db.add(entry)
    # Flush to allocate UUID to entry.id
    await db.flush()

    for line_data in lines_data:
        line = JournalEntryLine(
            journal_entry_id=entry.id,
            **line_data
        )
        db.add(line)

    # Flush all lines and commit transaction
    await db.flush()
    await db.commit()

    # Query with preloaded relationships to satisfy response model
    stmt = (
        select(JournalEntry)
        .options(selectinload(JournalEntry.lines))
        .where(JournalEntry.id == entry.id)
    )
    res = await db.execute(stmt)
    return res.scalar_one()


@router.get(
    "/analytics/revenue-mtd",
    summary="Get revenue month-to-date",
)
async def get_revenue_mtd(
    db: AsyncSession = Depends(get_db),
):
    """
    Calculate Month-To-Date revenue by summing credits minus debits
    for all revenue accounts in posted journal entries of the current month.
    """
    today = datetime.date.today()
    start_of_month = datetime.date(today.year, today.month, 1)
    if today.month == 12:
        next_month_start = datetime.date(today.year + 1, 1, 1)
    else:
        next_month_start = datetime.date(today.year, today.month + 1, 1)

    stmt = (
        select(
            func.sum(JournalEntryLine.credit - JournalEntryLine.debit)
        )
        .join(JournalEntryLine.account)
        .join(JournalEntryLine.journal_entry)
        .where(
            Account.account_type == AccountType.REVENUE,
            JournalEntry.entry_date >= start_of_month,
            JournalEntry.entry_date < next_month_start,
            JournalEntry.status == JournalEntryStatus.POSTED
        )
    )
    res = await db.execute(stmt)
    revenue = res.scalar() or 0.0
    return {"revenue_mtd": float(revenue)}


import uuid
from decimal import Decimal
from pydantic import BaseModel

from app.workspaces.finance.service import (
    tax_engine,
    invoicing_engine,
    payment_engine,
    banking_engine,
    reporting_engine,
    budget_engine,
    share_engine
)
from app.workspaces.finance.schemas import (
    InvoiceCreate, InvoiceResponse,
    PaymentCreate, PaymentResponse,
    BankClearanceResponse,
    BudgetCreate, BudgetResponse,
    ShareholderCreate, ShareholderResponse,
    ShareTransferCreate, ShareTransferResponse
)

# ─── Wrapper Models for Requests ──────────────────────────────────────────────

class ProcessInvoiceRequest(BaseModel):
    invoice: InvoiceCreate
    ar_account_id: uuid.UUID
    revenue_account_id: uuid.UUID
    tax_liability_account_id: uuid.UUID

class ProcessPaymentRequest(BaseModel):
    payment: PaymentCreate
    invoice_id: uuid.UUID
    cash_account_id: uuid.UUID
    ar_account_id: uuid.UUID

class BankClearanceRequest(BaseModel):
    transaction_id: uuid.UUID
    payment_id: uuid.UUID

class CalculateTaxRequest(BaseModel):
    subtotal: Decimal
    template_id: uuid.UUID

class ProcessShareTransferRequest(BaseModel):
    transfer: ShareTransferCreate
    equity_account_id: uuid.UUID
    cash_account_id: uuid.UUID


# ─── Invoices & Payments ──────────────────────────────────────────────────────

@router.get("/invoices", summary="List Invoices")
async def list_invoices(type: str = "sales", db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Invoice))
    return result.scalars().all()

@router.post("/invoices", response_model=InvoiceResponse, status_code=status.HTTP_201_CREATED, summary="Process a new invoice")
async def process_invoice(req: ProcessInvoiceRequest, db: AsyncSession = Depends(get_db)):
    """Process a new invoice and post associated GL entries."""
    return await invoicing_engine.process_invoice(
        db, req.invoice, req.ar_account_id, req.revenue_account_id, req.tax_liability_account_id
    )

@router.get("/payments", summary="List Payments")
async def list_payments(type: str = "entries", db: AsyncSession = Depends(get_db)):
    if type == "reconciliation":
        result = await db.execute(select(PaymentReconciliation))
    else:
        result = await db.execute(select(Payment))
    return result.scalars().all()

@router.post("/payments", response_model=PaymentResponse, status_code=status.HTTP_201_CREATED, summary="Process a new payment")
async def process_payment(req: ProcessPaymentRequest, db: AsyncSession = Depends(get_db)):
    """Process a payment, reconcile it against the invoice, and post GL entries."""
    return await payment_engine.process_payment(
        db, req.payment, req.invoice_id, req.cash_account_id, req.ar_account_id
    )

@router.get("/payment-reconciliations", summary="List payment reconciliations")
async def list_payment_reconciliations(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(PaymentReconciliation))
    return result.scalars().all()


# ─── Banking ──────────────────────────────────────────────────────────────────

@router.get("/banking/banks", summary="List Banks")
async def list_banks(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Bank))
    return result.scalars().all()

@router.get("/banking/accounts", summary="List Bank Accounts")
async def list_bank_accounts(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(BankAccount))
    return result.scalars().all()

@router.post("/banking/clearance", response_model=BankClearanceResponse, status_code=status.HTTP_201_CREATED, summary="Clear Bank Transaction")
async def clear_bank_transaction(req: BankClearanceRequest, db: AsyncSession = Depends(get_db)):
    """Clear a bank transaction against a recorded payment in the system."""
    return await banking_engine.clear_bank_transaction(db, req.transaction_id, req.payment_id)


# ─── Taxes ────────────────────────────────────────────────────────────────────

@router.get("/taxes/categories", summary="List Tax Categories")
async def list_tax_categories(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(TaxCategory))
    return result.scalars().all()

@router.get("/taxes/rules", summary="List Tax Rules")
async def list_tax_rules(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(TaxRule))
    return result.scalars().all()

@router.get("/taxes/templates", summary="List Tax Templates")
async def list_tax_templates(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(SalesTaxTemplate))
    return result.scalars().all()

@router.post("/taxes/calculate", summary="Calculate Tax Amount")
async def calculate_tax(req: CalculateTaxRequest, db: AsyncSession = Depends(get_db)):
    """Calculates tax based on the subtotal and specific tax template."""
    tax = await tax_engine.calculate_tax(db, req.subtotal, req.template_id)
    return {"calculated_tax": float(tax)}


# ─── Budgets ──────────────────────────────────────────────────────────────────

@router.get("/budgets", summary="List Budgets")
async def list_budgets(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Budget))
    return result.scalars().all()

@router.post("/budgets", response_model=BudgetResponse, status_code=status.HTTP_201_CREATED, summary="Create a new budget")
async def create_budget(req: BudgetCreate, db: AsyncSession = Depends(get_db)):
    return await budget_engine.create_budget(db, req)


# ─── Share Management ─────────────────────────────────────────────────────────

@router.get("/shares", summary="List Shareholders")
async def list_shares(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Shareholder))
    return result.scalars().all()

@router.post("/shares", response_model=ShareholderResponse, status_code=status.HTTP_201_CREATED, summary="Create Shareholder")
async def create_shareholder(req: ShareholderCreate, db: AsyncSession = Depends(get_db)):
    db_shareholder = Shareholder(**req.model_dump())
    db.add(db_shareholder)
    await db.commit()
    await db.refresh(db_shareholder)
    return db_shareholder

@router.post("/share-transfers", response_model=ShareTransferResponse, status_code=status.HTTP_201_CREATED, summary="Process Share Transfer")
async def process_share_transfer(req: ProcessShareTransferRequest, db: AsyncSession = Depends(get_db)):
    return await share_engine.process_share_transfer(db, req.transfer, req.equity_account_id, req.cash_account_id)


# ─── Reporting ────────────────────────────────────────────────────────────────

@router.get("/reports/balance-sheet", summary="Get Balance Sheet")
async def get_balance_sheet(db: AsyncSession = Depends(get_db)):
    """Dynamically aggregate fin_journal_entry_lines into a Balance Sheet."""
    return await reporting_engine.get_balance_sheet(db)

@router.get("/reports/profit-and-loss", summary="Get Profit and Loss")
async def get_profit_and_loss(db: AsyncSession = Depends(get_db)):
    """Dynamically aggregate fin_journal_entry_lines into a Profit & Loss statement."""
    return await reporting_engine.get_profit_and_loss(db)

@router.get("/reports/trial-balance", summary="Get Trial Balance")
async def get_trial_balance(db: AsyncSession = Depends(get_db)):
    """Dynamically aggregate fin_journal_entry_lines into a Trial Balance statement."""
    return await reporting_engine.get_trial_balance(db)
