import asyncio
import os
import sys
from dotenv import load_dotenv

# Add backend/ to path
sys.path.append(os.path.join(os.getcwd(), 'backend'))
load_dotenv(os.path.join(os.getcwd(), 'backend', '.env'))

from app.services.chat_service import process_chat_stream
from app.db.base import async_session_factory
from app.models.user import User
from sqlalchemy import select

async def main():
    async with async_session_factory() as db:
        # Get a test user
        result = await db.execute(select(User).limit(1))
        user = result.scalar_one_or_none()
        if not user:
            print("No user found for testing.")
            return

        # Simulate a session ID (you might need to create one if none exist)
        # For simplicity, we'll assume session_id 1 exists or just use a dummy one if the service allows
        session_id = 1 
        
        query = "What is the syllabus for CSE branch, specifically about Artificial Intelligence subject in R20 regulation?"
        metadata = {
            "module": "academics",
            "mode": "campus"
        }

        print(f"Testing Query: {query}")
        print("Response:\n")
        
        try:
            async for result in process_chat_stream(
                session_id=session_id,
                user_message=query,
                user_id=user.id,
                db=db,
                metadata=metadata
            ):
                if "token" in result:
                    print(result["token"], end="", flush=True)
        except Exception as e:
            print(f"\nError: {e}")

if __name__ == "__main__":
    asyncio.run(main())
