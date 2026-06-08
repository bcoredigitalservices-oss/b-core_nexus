import asyncio
from app.database import engine, Base
from app.models.organization import Organization

async def drop_table():
    async with engine.begin() as conn:
        # We only drop the organizations table to avoid losing other data
        await conn.run_sync(Base.metadata.drop_all, tables=[Organization.__table__])
    print("Dropped organizations table successfully.")

if __name__ == "__main__":
    asyncio.run(drop_table())
