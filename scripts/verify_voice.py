import asyncio
import sys
import os

# Add the backend directory to sys.path
sys.path.append(os.path.join(os.getcwd(), 'backend'))

from sqlalchemy import select
from app.db.base import async_session_factory
from app.models.voice_session import VoiceSession
from app.models.voice_message import VoiceMessage
from app.services import voice_service

async def verify_voice_persistence():
    async with async_session_factory() as db:
        # 1. Create a test user if needed (assuming user 1 exists)
        user_id = 1
        
        # 2. Create a voice session
        title = "Test Voice Session"
        session = await voice_service.create_voice_session(user_id=user_id, title=title, db=db)
        print(f"Created voice session ID: {session.id}")
        
        # 3. Process a stream (will add messages)
        # Note: This might hit the LLM, but we care about the DB part.
        # We can just manually add messages for verification if we want to avoid LLM.
        user_msg = VoiceMessage(session_id=session.id, role="user", content="Hello")
        assistant_msg = VoiceMessage(session_id=session.id, role="assistant", content="Hi there")
        db.add_all([user_msg, assistant_msg])
        await db.commit()
        print("Added manual test messages")
        
        # 4. Verify we can list it
        sessions = await voice_service.list_voice_sessions(user_id=user_id, db=db)
        found = any(s.id == session.id for s in sessions)
        print(f"Session found in list: {found}")
        
        # 5. Verify messages
        messages = await voice_service.get_voice_session_messages(session_id=session.id, user_id=user_id, db=db)
        print(f"Number of messages: {len(messages)}")
        
        if found and len(messages) == 2:
            print("SUCCESS: Voice persistence verified with separate tables.")
        else:
            print("FAILURE: Verification failed.")

if __name__ == "__main__":
    asyncio.run(verify_voice_persistence())
