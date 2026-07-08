import asyncio
from sqlalchemy.future import select
from app.database import AsyncSessionLocal
from app.core.auth.models import User
from app.core.auth.utils import get_password_hash

# Import other related models so SQLAlchemy model registry resolves relationships
from app.models.organization import Department
from app.models.workspace import Workspace

async def seed():
    print("Seeding requested administration accounts with fresh MFA states...")
    async with AsyncSessionLocal() as db:
        # Tier 0 (System Admin): dhruvkumardubey7440@gmail.com
        email_0 = "dhruvkumardubey7440@gmail.com"
        res_0 = await db.execute(select(User).where(User.email == email_0))
        user_0 = res_0.scalars().first()
        if not user_0:
            user_0 = User(
                email=email_0,
                hashed_password=get_password_hash("Dhruv@7440@sd"),
                designation="Tier 0 Superadmin",
                is_active=True,
                mfa_enabled=False,
                totp_secret=None
            )
            db.add(user_0)
            print(f"Created Tier 0 User: {email_0}")
        else:
            user_0.hashed_password = get_password_hash("Dhruv@7440@sd")
            user_0.designation = "Tier 0 Superadmin"
            user_0.is_active = True
            user_0.mfa_enabled = False
            user_0.totp_secret = None
            db.add(user_0)
            print(f"Reset & Updated Tier 0 User: {email_0}")

        # Tier 1 (Executive Admin): amandubey2269@gmail.com
        email_1 = "amandubey2269@gmail.com"
        res_1 = await db.execute(select(User).where(User.email == email_1))
        user_1 = res_1.scalars().first()
        if not user_1:
            user_1 = User(
                email=email_1,
                hashed_password=get_password_hash("Aman@7440#sd"),
                designation="Tier 1 Executive",
                is_active=True,
                mfa_enabled=False,
                totp_secret=None
            )
            db.add(user_1)
            print(f"Created Tier 1 User: {email_1}")
        else:
            user_1.hashed_password = get_password_hash("Aman@7440#sd")
            user_1.designation = "Tier 1 Executive"
            user_1.is_active = True
            user_1.mfa_enabled = False
            user_1.totp_secret = None
            db.add(user_1)
            print(f"Reset & Updated Tier 1 User: {email_1}")

        await db.commit()
    print("Accounts successfully seeded and MFA states reset.")

if __name__ == "__main__":
    asyncio.run(seed())
