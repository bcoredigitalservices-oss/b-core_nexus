import datetime
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.dependencies.auth import require_workspace_access
from app.database import get_db

from app.workspaces.finance.models import Account, JournalEntry, JournalEntryLine, AccountType, JournalEntryStatus
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

