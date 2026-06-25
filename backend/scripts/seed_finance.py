import os
import sys
import uuid
import asyncio
from datetime import date, timedelta
from dotenv import load_dotenv
from decimal import Decimal

# Ensure we can import app modules
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker
from app.workspaces.finance.models import (
    Bank, BankAccount, TaxCategory, TaxRule, Invoice, InvoiceItem, InvoiceStatus,
    Budget, Shareholder, ShareTransfer, Payment, PaymentStatus
)
from app.database import get_db_session

load_dotenv()
DATABASE_URL = os.getenv("DATABASE_URL")
engine = create_async_engine(DATABASE_URL)
AsyncSessionLocal = async_sessionmaker(bind=engine, expire_on_commit=False)

async def seed():
    async with AsyncSessionLocal() as session:
        # Create Banks
        b1 = Bank(id=uuid.uuid4(), bank_name="Global Bank of Commerce", swift_code="GBCXUS33")
        b2 = Bank(id=uuid.uuid4(), bank_name="Federal Reserve Credit Union", swift_code="FRCUUS44")
        session.add_all([b1, b2])
        await session.flush()

        # Create Bank Accounts
        ba1 = BankAccount(
            id=uuid.uuid4(), bank_id=b1.id, account_name="Main Operating Account", 
            account_number="OP-1234567890", currency="USD", current_balance=Decimal("1500000.00")
        )
        ba2 = BankAccount(
            id=uuid.uuid4(), bank_id=b2.id, account_name="Payroll Account", 
            account_number="PR-0987654321", currency="USD", current_balance=Decimal("250000.00")
        )
        session.add_all([ba1, ba2])

        # Create Tax Categories & Rules
        tc1 = TaxCategory(id=uuid.uuid4(), name="Standard VAT", description="Standard Value Added Tax 20%")
        tc2 = TaxCategory(id=uuid.uuid4(), name="Reduced VAT", description="Reduced Value Added Tax 5%")
        session.add_all([tc1, tc2])
        await session.flush()

        tr1 = TaxRule(id=uuid.uuid4(), tax_category_id=tc1.id, rate=Decimal("0.2000"), effective_date=date(2023, 1, 1), region="EU")
        tr2 = TaxRule(id=uuid.uuid4(), tax_category_id=tc2.id, rate=Decimal("0.0500"), effective_date=date(2023, 1, 1), region="EU")
        session.add_all([tr1, tr2])

        # Create Invoices
        inv1 = Invoice(
            id=uuid.uuid4(), invoice_number="INV-2026-0001", customer_id=uuid.uuid4(),
            invoice_date=date.today() - timedelta(days=5), due_date=date.today() + timedelta(days=25),
            status=InvoiceStatus.ISSUED, subtotal=Decimal("1000.00"), tax_total=Decimal("200.00"),
            total_amount=Decimal("1200.00"), amount_due=Decimal("1200.00"),
            custom_attributes={"type": "sales", "customer_name": "Acme Corp"}
        )
        inv2 = Invoice(
            id=uuid.uuid4(), invoice_number="INV-2026-0002", customer_id=uuid.uuid4(),
            invoice_date=date.today() - timedelta(days=1), due_date=date.today() + timedelta(days=29),
            status=InvoiceStatus.DRAFT, subtotal=Decimal("2500.00"), tax_total=Decimal("500.00"),
            total_amount=Decimal("3000.00"), amount_due=Decimal("3000.00"),
            custom_attributes={"type": "sales", "customer_name": "Globex Inc"}
        )
        inv3 = Invoice(
            id=uuid.uuid4(), invoice_number="PINV-2026-0001", customer_id=uuid.uuid4(),
            invoice_date=date.today() - timedelta(days=10), due_date=date.today() + timedelta(days=20),
            status=InvoiceStatus.PAID, subtotal=Decimal("5000.00"), tax_total=Decimal("1000.00"),
            total_amount=Decimal("6000.00"), amount_due=Decimal("0.00"),
            custom_attributes={"type": "purchase", "supplier_name": "Tech Supplies LLC"}
        )
        session.add_all([inv1, inv2, inv3])

        # Create Payments
        p1 = Payment(
            id=uuid.uuid4(), payment_reference="PAY-2026-1001", payment_date=date.today(),
            amount=Decimal("6000.00"), payment_method="Wire Transfer", status=PaymentStatus.COMPLETED,
            custom_attributes={"type": "purchase", "payee": "Tech Supplies LLC"}
        )
        p2 = Payment(
            id=uuid.uuid4(), payment_reference="PAY-2026-1002", payment_date=date.today() - timedelta(days=2),
            amount=Decimal("1200.00"), payment_method="Credit Card", status=PaymentStatus.PENDING,
            custom_attributes={"type": "sales", "payee": "Acme Corp"}
        )
        session.add_all([p1, p2])

        # Create Budgets
        bud1 = Budget(
            id=uuid.uuid4(), department="Marketing", fiscal_year="2026",
            total_allocation=Decimal("500000.00"), amount_spent=Decimal("125000.00"), status="Active"
        )
        bud2 = Budget(
            id=uuid.uuid4(), department="Engineering", fiscal_year="2026",
            total_allocation=Decimal("1200000.00"), amount_spent=Decimal("450000.00"), status="Active"
        )
        session.add_all([bud1, bud2])

        # Create Shareholders
        sh1 = Shareholder(
            id=uuid.uuid4(), shareholder_name="Vanguard Partners", share_type="Common",
            total_shares=Decimal("1000000"), equity_value=Decimal("5000000.00"), status="Active"
        )
        sh2 = Shareholder(
            id=uuid.uuid4(), shareholder_name="Jane Doe", share_type="Preferred",
            total_shares=Decimal("250000"), equity_value=Decimal("1250000.00"), status="Active"
        )
        session.add_all([sh1, sh2])

        await session.commit()
        print("Successfully seeded Finance DB!")

if __name__ == "__main__":
    asyncio.run(seed())
