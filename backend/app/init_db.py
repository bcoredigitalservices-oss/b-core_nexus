import asyncio
import sys
from sqlalchemy.future import select

# Import models to ensure they register on Base
from app.database import Base, engine, AsyncSessionLocal
from app.core.auth.models import User
from app.core.system.models import InstanceProfile
from app.models.organization import Organization, Department
from app.models.user import Permission, Role, EmployeeProfile, user_roles, role_permissions
from app.core.auth.utils import get_password_hash


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
                org = Organization(
                    name="B-Core Nexus Org",
                    industry_vertical="GENERAL_TRADING"
                )
                session.add(org)
                await session.flush()
                await session.commit()
                org = default_org
                print("Default Organization seeded.")

            # Seed default *:* permission
            perm_result = await session.execute(select(Permission).where(Permission.name == "*:*"))
            super_permission = perm_result.scalars().first()
            if not super_permission:
                super_permission = Permission(name="*:*")
                session.add(super_permission)
                await session.flush()

            # Seed default admin role
            role_result = await session.execute(select(Role).where(Role.name == "admin"))
            admin_role = role_result.scalars().first()
            if not admin_role:
                admin_role = Role(name="admin", description="Super Admin Role with full clearances")
                session.add(admin_role)
                await session.flush()

            # Link admin role to *:* permission
            assoc_result = await session.execute(
                select(role_permissions)
                .where(role_permissions.c.role_id == admin_role.id)
                .where(role_permissions.c.permission_id == super_permission.id)
            )
            if not assoc_result.first():
                await session.execute(role_permissions.insert().values(role_id=admin_role.id, permission_id=super_permission.id))
                await session.flush()

            result = await session.execute(select(User).filter(User.email == "admin@bcore.local"))
            admin = result.scalars().first()
            if not admin:
                print("Seeding initial Super Admin (admin@bcore.local)...")
                admin = User(
                    email="admin@bcore.local",
                    password_hash=get_password_hash("admin123"),
                    is_active=True,
                    custom_attributes={"notes": "Bootstrap System Administrator"}
                )
                session.add(admin)
                await session.flush()
                
                # create linked employee profile
                profile = EmployeeProfile(
                    user_id=admin.id,
                    first_name="System",
                    last_name="Administrator"
                )
                session.add(profile)
                await session.flush()
                
                # link to admin role
                await session.execute(user_roles.insert().values(user_id=admin.id, role_id=admin_role.id))
                await session.flush()
                await session.commit()
                print("Super Admin seeded successfully. Username: admin@bcore.local, Password: admin123")
            else:
                await session.commit()
                print("Admin user already exists in the system.")

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

            await session.commit()
            print("Standard Departments seeded successfully.")
        except Exception as e:
            print(f"Failed to seed administrator/modules.\nError: {e}", file=sys.stderr)

if __name__ == "__main__":
    asyncio.run(init_db())
