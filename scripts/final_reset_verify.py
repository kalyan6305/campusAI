import asyncio
import httpx
import os
import re
from sqlalchemy import select
from app.db.base import engine, async_session_factory
from app.models.user import User

async def get_valid_user():
    async with async_session_factory() as db:
        result = await db.execute(select(User).limit(1))
        user = result.scalar_one_or_none()
        return user.email if user else None

async def verify_reset_flow():
    base_url = "http://localhost:8000/api/v1"
    
    email = await get_valid_user()
    if not email:
        print("FAILED: No users found in database.")
        return
        
    print(f"--- Testing Reset Flow for: {email} ---")
    
    async with httpx.AsyncClient() as client:
        # 1. Request
        print("[1] Sending reset request...")
        res = await client.post(f"{base_url}/auth/password-reset-request", json={"email": email})
        print(f"Request status: {res.status_code}")
        
        # 2. Get token
        print("[2] Reading mock logs...")
        log_path = os.path.join(os.getcwd(), "logs", "email_previews.txt")
        if not os.path.exists(log_path):
            print(f"FAILED: Log file not found at {log_path}")
            return
            
        with open(log_path, "r") as f:
            content = f.read()
            
        tokens = re.findall(r"token=([a-zA-Z0-9\._\-]+)", content)
        if not tokens:
            print("FAILED: No token found in logs.")
            return
        
        token = tokens[-1]
        print(f"Token acquired: {token[:15]}...")
        
        # 3. Confirm
        print("[3] Confirming reset...")
        res = await client.post(f"{base_url}/auth/password-reset-confirm", json={
            "token": token,
            "new_password": "Verified_Password_123!"
        })
        print(f"Confirm status: {res.status_code}")
        
        if res.status_code == 200:
            print("\n!!! SUCCESS: Password reset flow verified end-to-end !!!")
        else:
            print(f"\nFAILED: {res.json()}")

    await engine.dispose()

if __name__ == "__main__":
    asyncio.run(verify_reset_flow())
