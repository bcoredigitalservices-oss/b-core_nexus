import asyncio
from sqlalchemy import text
from app.database import engine, Base

# Import all models to ensure they register on Base.metadata for dropping
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
from app.models.workspace import Workspace

# Workspace models
from app.workspaces.inventory.models import InventoryItem, Warehouse, StockLedger
from app.workspaces.crm.models import Customer, InteractionLog, SalesOrder, SalesOrderLine
from app.workspaces.finance.models import Account, JournalEntry, JournalEntryLine
from app.workspaces.hr.models import EmployeeRecord, LeaveRequest
from app.workspaces.operations.models import Project, Task

async def drop_all_tables():
    async with engine.begin() as conn:
        print("Dropping all tables with CASCADE...")
        for table in reversed(Base.metadata.sorted_tables):
            await conn.execute(text(f"DROP TABLE IF EXISTS {table.name} CASCADE;"))
    print("Dropped all database tables successfully.")

if __name__ == "__main__":
    asyncio.run(drop_all_tables())
