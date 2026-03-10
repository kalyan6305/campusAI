import asyncio
import httpx
import os
import re
from sqlalchemy import select
from app.db.base import engine, async_session_factory
from app.models.user import User
from app.models.password_reset import PasswordReset

async def get_test_email():
    async with async_session_factory() as db:
        result = await db.execute(select(User).limit(1))
        user = result.scalar_one_or_none()
        return user.email if user else None

async def verify_forgot_password_system():
    base_url = "http://localhost:8000/api/v1"
    
    email = await get_test_email()
    if not email:
        print("FAILED: No users found in database.")
        return
        
    print(f"--- Starting Full System Verification for: {email} ---")
    
    async with httpx.AsyncClient() as client:
        # 1. Trigger Forgot Password
        print("[1] Requesting forgot password...")
        res = await client.post(f"{base_url}/auth/forgot-password", json={"email": email})
        print(f"Status: {res.status_code} - {res.json()}")
        
        if res.status_code != 200:
            print("FAILED: Forgot password request rejected.")
            return

        # 2. Verify Token in DB
        print("[2] Verifying token in database...")
        async with async_session_factory() as db:
            result = await db.execute(select(PasswordReset).order_by(PasswordReset.id.desc()).limit(1))
            entry = result.scalar_one_or_none()
            if not entry:
                print("FAILED: No entry found in password_resets table.")
                return
            
            token = entry.reset_token
            print(f"Token Found: {token[:15]}...")
            print(f"Expires At: {entry.expires_at}")

        # 3. Test Reset Password
        print("[3] Confirming reset password with token...")
        new_password = "SystemReset_Verified_2026!"
        res = await client.post(f"{base_url}/auth/reset-password", json={
            "token": token,
            "new_password": new_password
        })
        print(f"Status: {res.status_code} - {res.json()}")
        
        if res.status_code != 200:
            print(f"FAILED: Reset confirmation failed: {res.json()}")
            return

        # 4. Verify Token Removal
        print("[4] Verifying token is invalidated after use...")
        async with async_session_factory() as db:
            result = await db.execute(select(PasswordReset).where(PasswordReset.reset_token == token))
            entry = result.scalar_one_or_none()
            if entry:
                print("FAILED: Token still exists in database after reset.")
                return
            print("Token correctly invalidated.")

        # 5. Verify New Login
        print("[5] Verifying login with new credentials...")
        login_res = await client.post(f"{base_url}/auth/login", json={
            "email": email,
            "password": new_password
        })
        if login_res.status_code == 200:
            print("\n!!! SUCCESS: ENTIRE FORGOT PASSWORD SYSTEM VERIFIED !!!")
        else:
            print(f"\nFAILED: New login failed: {login_res.json()}")

    await engine.dispose()

if __name__ == "__main__":
    asyncio.run(verify_forgot_password_system())
