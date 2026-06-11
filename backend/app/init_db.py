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

            # Seed standard Workspaces based on functional sub-modules
            standard_workspaces = [
                # Finance Workspaces
                {"name": "Accounting", "identifier": "accounting"},
                {"name": "Banking", "identifier": "banking"},
                {"name": "Taxes", "identifier": "taxes"},
                
                # Inventory Workspaces
                {"name": "Assets", "identifier": "assets"},
                {"name": "Products", "identifier": "products"},
                {"name": "Items", "identifier": "items"},
                {"name": "Warehouse", "identifier": "warehouse"},
                {"name": "Stock", "identifier": "stock"},
                {"name": "Buying", "identifier": "buying"},
                
                # CRM & Sales Workspaces
                {"name": "POS", "identifier": "pos"},
                {"name": "CRM", "identifier": "crm"},
                {"name": "Sales", "identifier": "sales"},
                {"name": "Support", "identifier": "support"},
                
                # Operations & Management Workspaces
                {"name": "Field Operations", "identifier": "field_ops"},
                {"name": "Maintenance", "identifier": "maintenance"},
                {"name": "Manufacturing", "identifier": "manufacturing"},
                {"name": "Projects", "identifier": "projects"},
                {"name": "QA", "identifier": "qa"},
                {"name": "QT", "identifier": "qt"},
                {"name": "Logistics", "identifier": "logistics"},
                
                # HR & Company Workspaces
                {"name": "Expenses", "identifier": "expenses"},
                {"name": "HR", "identifier": "hr"},
                {"name": "Payroll", "identifier": "payroll"},
                {"name": "Attendance", "identifier": "attendance"},
                {"name": "Recruitment", "identifier": "recruitment"},
                {"name": "Performance & Tenure", "identifier": "performance"},
                {"name": "Leaves", "identifier": "leaves"},
                
                # Communications Workspaces
                {"name": "Chats", "identifier": "chats"},
                {"name": "Employee Groups", "identifier": "employee_groups"},
                {"name": "Email", "identifier": "email"},
                {"name": "Message", "identifier": "message"},
                
                # Utilities Workspaces
                {"name": "Marketing", "identifier": "marketing"},
                {"name": "Campaigns", "identifier": "campaigns"},
                {"name": "Website", "identifier": "website"},
                
                # Internals
                {"name": "System Internals", "identifier": "internals"}
            ]
            for ws_data in standard_workspaces:
                res = await session.execute(select(Workspace).where(Workspace.identifier == ws_data["identifier"]))
                if not res.scalars().first():
                    ws = Workspace(
                        name=ws_data["name"],
                        identifier=ws_data["identifier"],
                        organization_id=org.id if org else None
                    )
                    session.add(ws)
            
            # Seed standard Departments based on the 8 core areas
            standard_departments = [
                "Finance",
                "Inventory",
                "CRM & Sales",
                "Operations & Management",
                "HR & Company",
                "Communications",
                "Utilities",
                "Internals"
            ]
            for dept_name in standard_departments:
                res = await session.execute(select(Department).where(Department.name == dept_name))
                if not res.scalars().first():
                    dept = Department(
                        name=dept_name,
                        organization_id=org.id if org else None
                    )
                    session.add(dept)

            # Seed default CRM Customers/Leads/Opportunities if empty
            cust_res = await session.execute(select(Customer))
            if not cust_res.scalars().first():
                print("Seeding default CRM Customers/Leads/Opportunities...")
                from datetime import datetime, timedelta, timezone
                from app.workspaces.crm.models import CustomerLifecycleStatus
                now_utc = datetime.now(timezone.utc)
                
                customers_to_seed = [
                    Customer(
                        company_name="Acme Corp",
                        contact_name="John Doe",
                        email="john@acme.com",
                        phone="+15550192",
                        lifecycle_status=CustomerLifecycleStatus.LEAD,
                        created_at=now_utc - timedelta(days=25)
                    ),
                    Customer(
                        company_name="Stark Industries",
                        contact_name="Tony Stark",
                        email="tony@stark.com",
                        phone="+15550193",
                        lifecycle_status=CustomerLifecycleStatus.LEAD,
                        created_at=now_utc - timedelta(days=20)
                    ),
                    Customer(
                        company_name="Wayne Enterprises",
                        contact_name="Bruce Wayne",
                        email="bruce@wayne.com",
                        phone="+15550194",
                        lifecycle_status=CustomerLifecycleStatus.LEAD,
                        created_at=now_utc - timedelta(days=15)
                    ),
                    Customer(
                        company_name="Oscorp",
                        contact_name="Norman Osborn",
                        email="norman@oscorp.com",
                        phone="+15550195",
                        lifecycle_status=CustomerLifecycleStatus.LEAD,
                        created_at=now_utc - timedelta(days=10)
                    ),
                    Customer(
                        company_name="LexCorp",
                        contact_name="Lex Luthor",
                        email="lex@lexcorp.com",
                        phone="+15550196",
                        lifecycle_status=CustomerLifecycleStatus.LEAD,
                        created_at=now_utc - timedelta(days=5)
                    ),
                    Customer(
                        company_name="Cyberdyne Systems",
                        contact_name="Sarah Connor",
                        email="sarah@cyberdyne.com",
                        phone="+15550197",
                        lifecycle_status=CustomerLifecycleStatus.OPPORTUNITY,
                        created_at=now_utc - timedelta(days=12)
                    ),
                    Customer(
                        company_name="Umbrella Corp",
                        contact_name="Albert Wesker",
                        email="albert@umbrella.com",
                        phone="+15550198",
                        lifecycle_status=CustomerLifecycleStatus.OPPORTUNITY,
                        created_at=now_utc - timedelta(days=8)
                    ),
                    Customer(
                        company_name="Tyrell Corp",
                        contact_name="Eldon Tyrell",
                        email="eldon@tyrell.com",
                        phone="+15550199",
                        lifecycle_status=CustomerLifecycleStatus.OPPORTUNITY,
                        created_at=now_utc - timedelta(days=3)
                    ),
                    Customer(
                        company_name="Soylent Corp",
                        contact_name="Robert Thorn",
                        email="robert@soylent.com",
                        phone="+15550200",
                        lifecycle_status=CustomerLifecycleStatus.ACTIVE_CUSTOMER,
                        created_at=now_utc - timedelta(days=18)
                    ),
                    Customer(
                        company_name="Initech",
                        contact_name="Peter Gibbons",
                        email="peter@initech.com",
                        phone="+15550201",
                        lifecycle_status=CustomerLifecycleStatus.ACTIVE_CUSTOMER,
                        created_at=now_utc - timedelta(days=4)
                    ),
                ]
                for c in customers_to_seed:
                    session.add(c)
                await session.flush()
                print("Default CRM Customers seeded successfully.")

            await session.commit()
            print("Standard Workspaces and Departments seeded successfully.")
        except Exception as e:
            print(f"Failed to seed administrator/modules.\nError: {e}", file=sys.stderr)

if __name__ == "__main__":
    asyncio.run(init_db())
