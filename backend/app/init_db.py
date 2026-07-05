import asyncio
import sys
from sqlalchemy.future import select

# Import models to ensure they register on Base
from app.database import Base, engine, AsyncSessionLocal
from app.core.auth.models import User
from app.core.system.models import InstanceProfile
from app.models.organization import Organization, Department
from app.models.user import Permission, Role, EmployeeProfile, user_roles, role_permissions, user_permissions
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
                # Assign *:* directly to admin user via user_permissions
                await session.execute(user_permissions.insert().values(
                    user_id=admin.id, permission_id=super_permission.id
                ))
                await session.commit()
                print("Super Admin seeded successfully. Username: admin@bcore.local, Password: admin123")
            else:
                await session.commit()
                print("Admin user already exists in the system.")
                
                # Ensure admin has *:* in user_permissions (idempotent)
                admin_direct_check = await session.execute(
                    select(user_permissions)
                    .where(user_permissions.c.user_id == admin.id)
                    .where(user_permissions.c.permission_id == super_permission.id)
                )
                if not admin_direct_check.first():
                    await session.execute(user_permissions.insert().values(
                        user_id=admin.id, permission_id=super_permission.id
                    ))

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

            # ── Seed workspace permissions ────────────────────────────────
            department_keys = {
                "accounting": "accounting",
                "invoicing": "invoicing",
                "payments": "payments",
                "banking": "banking",
                "taxes": "taxes",
                "reports": "reports",
                "budget": "budget",
                "shares": "shares",
                "assets": "assets",
                "products": "products",
                "warehouse": "warehouse",
                "stock": "stock",
                "buying": "buying",
                "pos": "pos",
                "crm": "crm",
                "sales": "sales",
                "support": "support",
                "field_ops": "field_ops",
                "maintenance": "maintenance",
                "manufacturing": "manufacturing",
                "projects": "projects",
                "qa": "qa",
                "logistics": "logistics",
                "expenses": "expenses",
                "hr": "hr",
                "payroll": "payroll",
                "attendance": "attendance",
                "recruitment": "recruitment",
                "performance": "performance",
                "leaves": "leaves",
                "chats": "chats",
                "employee_groups": "employee_groups",
                "email": "email",
                "message": "message",
                "marketing": "marketing",
                "website": "website",
                "internals": "internals",
                "cog": "cog"
            }
            operations_list = ["read", "write", "create", "delete", "print", "email", "export", "share", "report", "import", "mask"]
            for key in department_keys.values():
                for op in operations_list:
                    perm_name = f"{key}:{op}"
                    perm_res = await session.execute(
                        select(Permission).where(Permission.name == perm_name)
                    )
                    if not perm_res.scalars().first():
                        session.add(Permission(name=perm_name))
            # Seed system management permissions
            system_perms = ["iam:manage", "user:read", "user:write", "user:invite", "user:update"]
            for perm_name in system_perms:
                perm_res = await session.execute(
                    select(Permission).where(Permission.name == perm_name)
                )
                if not perm_res.scalars().first():
                    session.add(Permission(name=perm_name))
            await session.commit()
            print("Workspace permissions seeded successfully.")
            # ── Seed system_manager role ──────────────────────────────────
            sm_role_res = await session.execute(select(Role).where(Role.name == "system_manager"))
            sm_role = sm_role_res.scalars().first()
            if not sm_role:
                sm_role = Role(name="system_manager", description="System Manager with full administrative access")
                session.add(sm_role)
                await session.flush()
            # Link system_manager to *:* in role_permissions (backward compat)
            sm_rp_check = await session.execute(
                select(role_permissions)
                .where(role_permissions.c.role_id == sm_role.id)
                .where(role_permissions.c.permission_id == super_permission.id)
            )
            if not sm_rp_check.first():
                await session.execute(role_permissions.insert().values(
                    role_id=sm_role.id, permission_id=super_permission.id
                ))
            await session.commit()
            print("System Manager role seeded successfully.")

            await session.commit()
            print("Standard Departments seeded successfully.")
        except Exception as e:
            print(f"Failed to seed administrator/modules.\nError: {e}", file=sys.stderr)

if __name__ == "__main__":
    asyncio.run(init_db())
