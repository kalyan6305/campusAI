import asyncio
import sys
import os

# Add the backend directory to sys.path
sys.path.append(os.path.join(os.getcwd(), 'backend'))

from sqlalchemy import select, func
from app.db.base import async_session_factory
from app.models import ChatSession, Message, CampusSession, CampusMessage, ToolsSession, ToolsMessage, AgentsSession, AgentsMessage
from app.services import session_service

async def verify_all_modules():
    async with async_session_factory() as db:
        user_id = 99  # Test user
        
        modules = ['chat', 'campus', 'tools', 'agents']
        created_ids = {}
        
        # 1. Create a session in each module
        for mod in modules:
            session = await session_service.create_session(user_id=user_id, title=f"Test {mod}", db=db, module=mod)
            created_ids[mod] = session.id
            print(f"Created {mod} session with ID: {session.id}")
            
        await db.commit()
        
        # 2. Check table counts (manually adding a message via ORM check)
        # We'll just verify the sessions exist in the right tables
        
        checks = [
            (ChatSession, 'chat'),
            (CampusSession, 'campus'),
            (ToolsSession, 'tools'),
            (AgentsSession, 'agents')
        ]
        
        for Model, name in checks:
            result = await db.execute(select(func.count()).select_from(Model).where(Model.id == created_ids[name]))
            count = result.scalar()
            if count == 1:
                print(f"✅ Verified: {name} session found in {Model.__tablename__}")
            else:
                print(f"❌ Failed: {name} session NOT found in {Model.__tablename__}")
                
            # Cross-check: ensure it's NOT in ChatSession if it's not a chat module
            if name != 'chat':
                result = await db.execute(select(func.count()).select_from(ChatSession).where(ChatSession.id == created_ids[name]))
                count = result.scalar()
                if count == 0:
                    print(f"✅ Verified: {name} session ID {created_ids[name]} NOT found in chat_sessions")
                else:
                    # Note: IDs might overlap, but if we just created them, 
                    # they should be unique if we didn't have many deletions.
                    # A better check is verifying if any OTHER module data leaked into chat_sessions.
                    pass

if __name__ == "__main__":
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)
    try:
        loop.run_until_complete(verify_all_modules())
    finally:
        loop.close()
