import uuid
from decimal import Decimal
from datetime import date
from typing import List, Dict, Any, Optional

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import func

from .models import (
    Invoice, InvoiceItem, Payment, PaymentReconciliation,
    BankTransaction, BankClearance, TaxRule, SalesTaxTemplate,
    JournalEntry, JournalEntryLine, Account,
    InvoiceStatus, PaymentStatus, ClearanceStatus, JournalEntryStatus,
    AccountType, Budget, Shareholder, ShareTransfer
)
from .schemas import (
    InvoiceCreate, PaymentCreate, BankClearanceCreate,
    BudgetCreate, ShareholderCreate, ShareTransferCreate
)


class TaxEngine:
    """
    Calculates tax amounts based on Templates, Categories, and Rules.
    """
    async def calculate_tax(self, db: AsyncSession, subtotal: Decimal, template_id: uuid.UUID) -> Decimal:
        template = await db.scalar(select(SalesTaxTemplate).filter_by(id=template_id))
        if not template:
            return Decimal("0.0")
        
        rule = await db.scalar(select(TaxRule).filter_by(id=template.tax_rule_id))
        if not rule:
            return Decimal("0.0")
            
        tax_amount = subtotal * rule.rate
        return tax_amount.quantize(Decimal("0.01"))


class InvoicingEngine:
    """
    Processes invoices, triggers the TaxEngine, and posts double-entry GL JournalEntry records.
    """
    async def process_invoice(
        self, db: AsyncSession, invoice_in: InvoiceCreate, ar_account_id: uuid.UUID, revenue_account_id: uuid.UUID, tax_liability_account_id: uuid.UUID
    ) -> Invoice:
        # 1. Persist the Invoice record
        db_invoice = Invoice(
            invoice_number=invoice_in.invoice_number,
            customer_id=invoice_in.customer_id,
            invoice_date=invoice_in.invoice_date,
            due_date=invoice_in.due_date,
            status=InvoiceStatus.ISSUED,
            subtotal=invoice_in.subtotal,
            tax_total=invoice_in.tax_total,
            total_amount=invoice_in.total_amount,
            amount_due=invoice_in.amount_due
        )
        db.add(db_invoice)
        await db.flush()

        # 2. Create the associated GL Entry
        je = JournalEntry(
            entry_date=invoice_in.invoice_date,
            reference_number=f"INV-{invoice_in.invoice_number}",
            description=f"Customer Invoice {invoice_in.invoice_number}",
            status=JournalEntryStatus.POSTED
        )
        db.add(je)
        await db.flush()
        
        # Link the invoice to the journal entry
        db_invoice.journal_entry_id = je.id

        # 3. Double-entry postings
        # AR Debit
        db.add(JournalEntryLine(
            journal_entry_id=je.id,
            account_id=ar_account_id,
            debit=invoice_in.total_amount,
            credit=Decimal("0.0")
        ))
        
        # Revenue Credit
        db.add(JournalEntryLine(
            journal_entry_id=je.id,
            account_id=revenue_account_id,
            debit=Decimal("0.0"),
            credit=invoice_in.subtotal
        ))
        
        # Tax Liability Credit (if applicable)
        if invoice_in.tax_total > Decimal("0.0"):
            db.add(JournalEntryLine(
                journal_entry_id=je.id,
                account_id=tax_liability_account_id,
                debit=Decimal("0.0"),
                credit=invoice_in.tax_total
            ))
            
        await db.flush()
        return db_invoice


class PaymentEngine:
    """
    Processes payments, handles PaymentReconciliation to clear invoice amount_due, 
    and posts the corresponding JournalEntry.
    """
    async def process_payment(
        self, db: AsyncSession, payment_in: PaymentCreate, invoice_id: uuid.UUID, 
        cash_account_id: uuid.UUID, ar_account_id: uuid.UUID
    ) -> Payment:
        # 1. Record the Payment
        db_payment = Payment(
            payment_reference=payment_in.payment_reference,
            payment_date=payment_in.payment_date,
            amount=payment_in.amount,
            payment_method=payment_in.payment_method,
            status=PaymentStatus.COMPLETED
        )
        db.add(db_payment)
        await db.flush()

        # 2. Reconcile against the Invoice
        invoice = await db.scalar(select(Invoice).filter_by(id=invoice_id))
        if not invoice:
            raise ValueError("Target invoice for payment reconciliation not found.")
            
        recon = PaymentReconciliation(
            payment_id=db_payment.id,
            invoice_id=invoice.id,
            amount_applied=payment_in.amount,
            reconciliation_date=payment_in.payment_date
        )
        db.add(recon)
        
        # Adjust Invoice amount due and status
        invoice.amount_due -= payment_in.amount
        if invoice.amount_due <= 0:
            invoice.amount_due = Decimal("0.0")
            invoice.status = InvoiceStatus.PAID
        else:
            invoice.status = InvoiceStatus.PARTIALLY_PAID
            
        await db.flush()

        # 3. Create GL Entry (Debit Cash, Credit AR)
        je = JournalEntry(
            entry_date=payment_in.payment_date,
            reference_number=f"PAY-{payment_in.payment_reference}",
            description=f"Payment for Invoice {invoice.invoice_number}",
            status=JournalEntryStatus.POSTED
        )
        db.add(je)
        await db.flush()
        
        db_payment.journal_entry_id = je.id
        
        db.add(JournalEntryLine(
            journal_entry_id=je.id,
            account_id=cash_account_id,
            debit=payment_in.amount,
            credit=Decimal("0.0")
        ))
        
        db.add(JournalEntryLine(
            journal_entry_id=je.id,
            account_id=ar_account_id,
            debit=Decimal("0.0"),
            credit=payment_in.amount
        ))
        
        await db.flush()
        return db_payment


class BankingEngine:
    """
    Handles Bank Clearance and matching payments to imported bank transactions.
    """
    async def clear_bank_transaction(
        self, db: AsyncSession, transaction_id: uuid.UUID, payment_id: uuid.UUID
    ) -> BankClearance:
        txn = await db.scalar(select(BankTransaction).filter_by(id=transaction_id))
        if not txn:
            raise ValueError("Bank transaction not found for clearance.")
            
        clearance = BankClearance(
            bank_transaction_id=transaction_id,
            payment_id=payment_id,
            clearance_date=date.today(),
            status=ClearanceStatus.CLEARED
        )
        db.add(clearance)
        await db.flush()
        return clearance


class ReportingEngine:
    """
    Dynamically aggregates fin_journal_entry_lines into financial reports.
    """
    async def get_trial_balance(self, db: AsyncSession) -> List[Dict[str, Any]]:
        stmt = (
            select(
                Account.account_code,
                Account.account_name,
                func.sum(JournalEntryLine.debit).label("total_debit"),
                func.sum(JournalEntryLine.credit).label("total_credit")
            )
            .join(JournalEntryLine, Account.id == JournalEntryLine.account_id)
            .group_by(Account.account_code, Account.account_name)
        )
        result = await db.execute(stmt)
        
        return [
            {
                "account_code": row.account_code,
                "account_name": row.account_name,
                "debit": row.total_debit or Decimal("0.0"),
                "credit": row.total_credit or Decimal("0.0")
            }
            for row in result.all()
        ]

    async def get_balance_sheet(self, db: AsyncSession) -> Dict[str, Any]:
        stmt = (
            select(
                Account.account_type,
                func.sum(JournalEntryLine.debit).label("debit"),
                func.sum(JournalEntryLine.credit).label("credit")
            )
            .join(JournalEntryLine, Account.id == JournalEntryLine.account_id)
            .filter(Account.account_type.in_([AccountType.ASSET, AccountType.LIABILITY, AccountType.EQUITY]))
            .group_by(Account.account_type)
        )
        result = await db.execute(stmt)
        
        report = {
            AccountType.ASSET.value: Decimal("0.0"),
            AccountType.LIABILITY.value: Decimal("0.0"),
            AccountType.EQUITY.value: Decimal("0.0")
        }
        
        for row in result.all():
            # Standard logic: Assets = Debit - Credit | Liabilities/Equity = Credit - Debit
            if row.account_type == AccountType.ASSET:
                report[row.account_type.value] = (row.debit or Decimal("0.0")) - (row.credit or Decimal("0.0"))
            else:
                report[row.account_type.value] = (row.credit or Decimal("0.0")) - (row.debit or Decimal("0.0"))
                
        return report

    async def get_profit_and_loss(self, db: AsyncSession) -> Dict[str, Any]:
        stmt = (
            select(
                Account.account_type,
                func.sum(JournalEntryLine.debit).label("debit"),
                func.sum(JournalEntryLine.credit).label("credit")
            )
            .join(JournalEntryLine, Account.id == JournalEntryLine.account_id)
            .filter(Account.account_type.in_([AccountType.REVENUE, AccountType.EXPENSE]))
            .group_by(Account.account_type)
        )
        result = await db.execute(stmt)
        
        report = {
            AccountType.REVENUE.value: Decimal("0.0"),
            AccountType.EXPENSE.value: Decimal("0.0")
        }
        
        for row in result.all():
            if row.account_type == AccountType.REVENUE:
                report[row.account_type.value] = (row.credit or Decimal("0.0")) - (row.debit or Decimal("0.0"))
            else:
                report[row.account_type.value] = (row.debit or Decimal("0.0")) - (row.credit or Decimal("0.0"))
                
        return report
        
    async def get_cash_flow(self, db: AsyncSession) -> Dict[str, Any]:
        # Simplified placeholder for cash flow mapping
        return {"net_cash_flow": Decimal("0.0")}


class BudgetEngine:
    async def create_budget(self, db: AsyncSession, budget_in: BudgetCreate) -> Budget:
        db_budget = Budget(**budget_in.model_dump())
        db.add(db_budget)
        await db.flush()
        return db_budget


class ShareManagementEngine:
    async def process_share_transfer(
        self, db: AsyncSession, transfer_in: ShareTransferCreate, equity_account_id: uuid.UUID, cash_account_id: uuid.UUID
    ) -> ShareTransfer:
        db_transfer = ShareTransfer(**transfer_in.model_dump())
        db.add(db_transfer)
        
        shareholder = await db.scalar(select(Shareholder).filter_by(id=transfer_in.shareholder_id))
        if not shareholder:
            raise ValueError("Shareholder not found.")
            
        total_value = transfer_in.number_of_shares * transfer_in.price_per_share
        shareholder.total_shares += transfer_in.number_of_shares
        shareholder.equity_value += total_value

        je = JournalEntry(
            entry_date=transfer_in.transfer_date,
            reference_number=f"EQ-{uuid.uuid4().hex[:8].upper()}",
            description=f"Share Transfer for {shareholder.shareholder_name}",
            status=JournalEntryStatus.POSTED
        )
        db.add(je)
        await db.flush()
        
        db_transfer.journal_entry_id = je.id
        
        # Debit Cash, Credit Equity
        db.add(JournalEntryLine(
            journal_entry_id=je.id,
            account_id=cash_account_id,
            debit=total_value,
            credit=Decimal("0.0")
        ))
        db.add(JournalEntryLine(
            journal_entry_id=je.id,
            account_id=equity_account_id,
            debit=Decimal("0.0"),
            credit=total_value
        ))
        
        await db.flush()
        return db_transfer


# Instantiate engines for import dependency injection
tax_engine = TaxEngine()
invoicing_engine = InvoicingEngine()
payment_engine = PaymentEngine()
banking_engine = BankingEngine()
reporting_engine = ReportingEngine()
budget_engine = BudgetEngine()
share_engine = ShareManagementEngine()
