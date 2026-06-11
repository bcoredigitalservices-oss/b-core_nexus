#!/usr/bin/env python3
import argparse
import asyncio
import os
import sys
import getpass
from passlib.context import CryptContext
from sqlalchemy.future import select

# Ensure the parent app directory is in sys.path for proper resolution
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.database import AsyncSessionLocal
from app.core.auth.models import User
from app.models.organization import Department  # Required for SQLAlchemy mapper

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

async def create_genesis_admin(first_name: str, last_name: str, email: str, password: str):
    hashed_pwd = pwd_context.hash(password)
    
    async with AsyncSessionLocal() as session:
        # Check if email already exists to prevent duplicates
        result = await session.execute(select(User).where(User.email == email))
        existing_user = result.scalars().first()
        if existing_user:
            print(f"Error: User with email {email} already exists.")
            return

        print(f"Creating Tier 0 Genesis Admin '{first_name} {last_name}' without deleting existing data...")
        
        # Create new Tier 0 User
        new_admin = User(
            first_name=first_name,
            last_name=last_name,
            email=email,
            hashed_password=hashed_pwd,
            role_tier=0,
            is_active=True,
            totp_secret=None,
            mfa_enabled=False,
            functional_roles=["admin", "root"]
        )
        session.add(new_admin)
        await session.commit()
        
        print("\n" + "=" * 60)
        print(" GENESIS ADMIN CREATION SUCCESSFUL ")
        print("=" * 60)
        print(f"Name:               {first_name} {last_name}")
        print(f"Email:              {email}")
        print(f"Role Tier:          0 (System Admin / Root)")
        print("-" * 60)
        print("INSTRUCTIONS:")
        print("1. Log in with your email and password.")
        print("2. The frontend will automatically prompt you to set up your MOTP (MFA) via a QR code.")
        print("3. Once scanned and verified, Tier 0 2FA will be permanently activated.")
        print("=" * 60 + "\n")

def main():
    print("=" * 60)
    print(" B-CORE NEXUS: TIER 0 GENESIS ADMIN SETUP ")
    print("=" * 60)
    
    full_name = input("Enter Full Name: ").strip()
    email = input("Enter Email Address: ").strip()
    
    while True:
        password = getpass.getpass("Enter Password (min 12 characters): ").strip()
        if len(password) >= 12:
            break
        print("Error: Password must be at least 12 characters long.")
        
    name_parts = full_name.split(" ", 1)
    first_name = name_parts[0]
    last_name = name_parts[1] if len(name_parts) > 1 else ""
    
    asyncio.run(create_genesis_admin(first_name, last_name, email, password))

if __name__ == "__main__":
    main()
