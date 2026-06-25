import os
import sys
import asyncio
from dotenv import load_dotenv
from sqlalchemy import text

# Ensure we can import app modules
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker

load_dotenv()
DATABASE_URL = os.getenv("DATABASE_URL")
engine = create_async_engine(DATABASE_URL)
AsyncSessionLocal = async_sessionmaker(bind=engine, expire_on_commit=False)

async def unseed():
    async with AsyncSessionLocal() as session:
        # We execute raw SQL DELETE statements to clear the tables
        tables_to_clear = [
            "fin_payments",
            "fin_invoice_items",
            "fin_invoices",
            "fin_tax_rules",
            "fin_tax_categories",
            "fin_bank_accounts",
            "fin_banks",
            "fin_budgets",
            "fin_share_transfers",
            "fin_shareholders",
            "fin_accounts"
        ]
        
        for table in tables_to_clear:
            try:
                await session.execute(text(f"DELETE FROM {table}"))
            except Exception as e:
                print(f"Error clearing {table}: {e}")
                
        await session.commit()
        print("Successfully removed all mock data from Finance DB!")

if __name__ == "__main__":
    asyncio.run(unseed())
