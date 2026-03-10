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
    try:
        async with async_session_factory() as db:
            user_id = 2  # Use a different test user ID
            
            title = "Test Voice Session Partitioned"
            session = await voice_service.create_voice_session(user_id=user_id, title=title, db=db)
            print(f"Created voice session ID: {session.id}")
            
            user_msg = VoiceMessage(session_id=session.id, role="user", content="Hello Partition")
            assistant_msg = VoiceMessage(session_id=session.id, role="assistant", content="Hi Partition")
            db.add_all([user_msg, assistant_msg])
            await db.commit()
            print("Added manual test messages")
            
            sessions = await voice_service.list_voice_sessions(user_id=user_id, db=db)
            found = any(s.id == session.id for s in sessions)
            print(f"Session found in list: {found}")
            
            messages = await voice_service.get_voice_session_messages(session_id=session.id, user_id=user_id, db=db)
            print(f"Number of messages: {len(messages)}")
            
            if found and len(messages) == 2:
                print("✅ SUCCESS: Voice persistence verified with separate tables.")
            else:
                print("❌ FAILURE: Verification failed.")
    except Exception as e:
        print(f"❌ ERROR: {e}")

if __name__ == "__main__":
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)
    try:
        loop.run_until_complete(verify_voice_persistence())
    finally:
        loop.close()
