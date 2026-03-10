import asyncio
from app.db.base import async_session_factory as async_session
from app.models.user import User
from app.services import auth_service
from sqlalchemy import select
import json

async def verify_stats_logic():
    async with async_session() as db:
        # Get first user
        users = await db.execute(select(User).limit(1))
        user = users.scalar_one_or_none()
        if not user:
            print("NO_USER_FOUND")
            return
        
        print(f"Verifying stats for user: {user.email} (ID: {user.id})")
        
        # Call the service directly to verify logic
        stats = await auth_service.get_user_stats(user.id, db)
        
        print("\nAggregated Stats Result:")
        print(json.dumps(stats, indent=2))
        
        if "total_sessions" in stats and "total_messages" in stats:
            print("\nVerification SUCCESS: Service returned all metric fields.")
        else:
            print("\nVerification FAILED: Service returned incomplete data.")

if __name__ == "__main__":
    asyncio.run(verify_stats_logic())
