import asyncio
import sys
import os

# Add the backend directory to sys.path
sys.path.append(os.path.join(os.getcwd(), 'backend'))

from sqlalchemy import select, func
from app.db.base import async_session_factory
from app.models import ChatSession, ChatMessage, CampusSession, CampusMessage, ToolsSession, ToolsMessage, AgentsSession, AgentsMessage

async def verify_home_isolation():
    async with async_session_factory() as db:
        # 1. Check if ChatMessage is in chat_messages table
        print(f"ChatMessage table name: {ChatMessage.__tablename__}")
        
        # 2. Add a test chat session and message
        from app.services import session_service, chat_service
        user_id = 99
        
        session = await session_service.create_session(user_id=user_id, title="Test Home Isolation", db=db, module="chat")
        print(f"Created chat session ID: {session.id}")
        
        # Manually add a message to verify table
        msg = ChatMessage(session_id=session.id, role="user", content="Hello Home")
        db.add(msg)
        await db.commit()
        
        # 3. Verify it's in chat_messages table
        result = await db.execute(select(func.count()).select_from(ChatMessage).where(ChatMessage.session_id == session.id))
        count = result.scalar()
        if count == 1:
            print(f"✅ Verified: Message stored in {ChatMessage.__tablename__}")
        else:
            print(f"❌ Failed: Message NOT stored in {ChatMessage.__tablename__}")

if __name__ == "__main__":
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)
    try:
        loop.run_until_complete(verify_home_isolation())
    finally:
        loop.close()
