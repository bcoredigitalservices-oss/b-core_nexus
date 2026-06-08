#!/usr/bin/env python3
import argparse
import asyncio
import os
import sys
import pyotp
import qrcode
from passlib.context import CryptContext
from sqlalchemy import delete
from sqlalchemy.future import select

# Ensure the parent app directory is in sys.path for proper resolution
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.database import AsyncSessionLocal
from app.core.auth.models import User
from app.core.events.models import EventLog

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

async def create_genesis_admin(email: str, password: str, force: bool = False):
    hashed_pwd = pwd_context.hash(password)
    totp_secret = pyotp.random_base32()
    
    # Generate Google Authenticator URI
    totp_obj = pyotp.totp.TOTP(totp_secret)
    provisioning_uri = totp_obj.provisioning_uri(
        name=email,
        issuer_name="B-Core Nexus (Tier 0)"
    )
    
    async with AsyncSessionLocal() as session:
        if not force:
            result = await session.execute(select(User))
            existing_user = result.scalars().first()
            if existing_user:
                print("Error: Database already contains user profiles. To prevent data loss, the tables were not wiped.")
                print("If you wish to re-seed and completely erase existing users, run this script with the --force flag.")
                return

        print("Clearing database records for user re-creation...")
        # Delete related event logs first due to FK constraints
        await session.execute(delete(EventLog))
        # Purge users
        await session.execute(delete(User))
        await session.commit()
        
        # Create new Tier 0 User
        new_admin = User(
            email=email,
            hashed_password=hashed_pwd,
            role_tier=0,
            is_active=True,
            totp_secret=totp_secret,
            mfa_enabled=True,
            functional_roles=["admin", "root"]
        )
        session.add(new_admin)
        await session.commit()
        
        print("\n" + "=" * 60)
        print(" GENESIS ADMIN CREATION SUCCESSFUL (DATABASE RESEEDED) ")
        print("=" * 60)
        print(f"Email:              {email}")
        print(f"Role Tier:          0 (System Admin / Root)")
        print(f"TOTP Secret:        {totp_secret}")
        print("-" * 60)
        print("MFA REGISTRATION QR CODE (SCAN IN AUTHENTICATOR APP):")
        print("-" * 60)
        
        # Draw QR code in the terminal
        qr = qrcode.QRCode(version=1, box_size=1, border=2)
        qr.add_data(provisioning_uri)
        qr.make(fit=True)
        qr.print_ascii(invert=True)
        
        print("-" * 60)
        print("GOOGLE AUTHENTICATOR PROVISIONING URI:")
        print(provisioning_uri)
        print("-" * 60)
        print("INSTRUCTIONS:")
        print("1. Scan the QR code above using your Authenticator App (Google Authenticator, Duo, Authy, etc.).")
        print("2. If the terminal QR code is not scanning, enter the TOTP Secret key manually.")
        print("3. Log in with your email, password, and the generated 6-digit TOTP token.")
        print("=" * 60 + "\n")

def main():
    parser = argparse.ArgumentParser(description="Clean database and bootstrap a new Tier 0 System Admin.")
    parser.add_argument("--email", required=True, help="Email address of the genesis admin")
    parser.add_argument("--password", required=True, help="Password of the genesis admin (min 12 characters)")
    parser.add_argument("--force", action="store_true", help="Force database re-seeding and delete all existing data")
    args = parser.parse_args()
    
    if len(args.password) < 12:
        print("Error: Password must be at least 12 characters long.", file=sys.stderr)
        sys.exit(1)
        
    asyncio.run(create_genesis_admin(args.email, args.password, args.force))

if __name__ == "__main__":
    main()
