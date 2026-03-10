import asyncio
import httpx
import os
import re

async def verify_password_reset():
    base_url = "http://localhost:8000/api/v1"
    test_email = "test@example.com"
    new_password = "newpassword123!"
    
    print(f"--- Starting Password Reset Verification for {test_email} ---")
    
    # 1. Request Reset
    async with httpx.AsyncClient() as client:
        print("[Step 1] Requesting password reset...")
        res = await client.post(f"{base_url}/auth/password-reset-request", json={"email": test_email})
        print(f"Response: {res.status_code} - {res.json()}")
        
        if res.status_code != 200:
            print("FAILED: Request rejected.")
            return

        # 2. Extract Token from Mock Log
        print("[Step 2] Extracting token from mock email logs...")
        log_path = os.path.join("d:\\projects\\campus_ai\\backend", "logs", "email_previews.txt")
        if not os.path.exists(log_path):
            print(f"FAILED: Log file not found at {log_path}")
            return
            
        with open(log_path, "r") as f:
            content = f.read()
            
        # Find the latest token in the log
        tokens = re.findall(r"token=([a-zA-Z0-9\._\-]+)", content)
        if not tokens:
            print("FAILED: No token found in logs.")
            return
            
        token = tokens[-1]
        print(f"Found Token: {token[:20]}...")

        # 3. Confirm Reset
        print("[Step 3] Confirming password reset with new password...")
        confirm_data = {
            "token": token,
            "new_password": new_password
        }
        res = await client.post(f"{base_url}/auth/password-reset-confirm", json=confirm_data)
        print(f"Response: {res.status_code} - {res.json()}")
        
        if res.status_code == 200:
            print("\n--- VERIFICATION SUCCESSFUL ---")
            print("User can now log in with the new password.")
        else:
            print(f"\n--- VERIFICATION FAILED ---")

if __name__ == "__main__":
    asyncio.run(verify_password_reset())
