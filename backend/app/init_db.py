import asyncio
import sys
from sqlalchemy.future import select

# Import models to ensure they register on Base
from app.database import Base, engine, AsyncSessionLocal
from app.core.auth.models import User
from app.core.directory.models import DirectoryProfile, Entity
from app.core.catalog.models import CatalogItem, Item
from app.core.events.models import EventLog
from app.core.system.models import InstanceProfile
from app.core.localization.models import SystemSettings
from app.core.finance.currency_models import Currency, ExchangeRate
from app.core.finance.tax_models import TaxRegion, TaxCategory, TaxRule
from app.core.ledger.models import Transaction, LedgerEntry
from app.core.sequencing.models import DocumentSequence
from app.models.organization import Organization, Department
from app.models.workspace import Workspace, user_workspaces
from app.core.auth.utils import get_password_hash
# Workspace models — must be imported so Base.metadata registers their tables
from app.workspaces.inventory.models import InventoryItem, Warehouse, StockLedger
from app.workspaces.crm.models import Customer, InteractionLog, SalesOrder, SalesOrderLine
from app.workspaces.finance.models import Account, JournalEntry, JournalEntryLine
from app.workspaces.hr.models import EmployeeRecord, LeaveRequest
from app.workspaces.operations.models import Project, Task


async def init_db():
    print("Initializing B-Core Nexus Database tables...")
    try:
        async with engine.begin() as conn:
            # Create all registered tables
            await conn.run_sync(Base.metadata.create_all)
        print("Database tables created successfully.")
    except Exception as e:
        print(f"Failed to create tables. Verify that PostgreSQL is running.\nError: {e}", file=sys.stderr)
        return

    # Seed initial Tier 1 Administrator
    async with AsyncSessionLocal() as session:
        try:
            # Seed default Organization if not exists
            org_result = await session.execute(select(Organization))
            org = org_result.scalars().first()
            if not org:
                print("Seeding default Organization (GENERAL_TRADING)...")
                default_org = Organization(
                    name="B-Core Nexus Org",
                    industry_vertical="GENERAL_TRADING"
                )
                session.add(default_org)
                await session.flush()
                print("Default Organization seeded.")

            result = await session.execute(select(User).filter(User.email == "admin@bcore.local"))
            admin = result.scalars().first()
            if not admin:
                print("Seeding initial Tier 1 Executive Admin (admin@bcore.local)...")
                admin_user = User(
                    email="admin@bcore.local",
                    hashed_password=get_password_hash("admin123"),
                    role_tier=1,  # Tier 1 (Executive Admin)
                    is_active=True,
                    custom_attributes={"notes": "Bootstrap System Administrator"}
                )
                session.add(admin_user)
                await session.commit()
                print("Tier 1 Admin seeded successfully. Username: admin@bcore.local, Password: admin123")
            else:
                await session.commit()
                print("Admin user already exists in the system.")
        except Exception as e:
            print(f"Failed to seed administrator.\nError: {e}", file=sys.stderr)

if __name__ == "__main__":
    asyncio.run(init_db())
