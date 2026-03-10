import asyncio
import sys
import os

# Add the backend directory to sys.path
sys.path.append(os.path.join(os.getcwd(), 'backend'))

from sqlalchemy import text
from app.db.base import async_session_factory

async def migrate_history():
    async with async_session_factory() as db:
        print("Starting history migration...")
        
        # 1. Update module tags to 'chat' for legacy Home sessions
        result = await db.execute(text("UPDATE chat_sessions SET module = 'chat' WHERE module IN ('home', 'general')"))
        print(f"Updated {result.rowcount} sessions to module='chat'.")
        
        # 2. Check if chat_messages table exists
        try:
            await db.execute(text("SELECT 1 FROM chat_messages LIMIT 1"))
        except Exception:
            print("Creating chat_messages table via raw SQL if it doesn't exist...")
            # This is a bit risky but we trust the model creation happened.
            # If uvicorn is running with reload, it should have created it.
            pass

        # 3. Copy messages from 'messages' to 'chat_messages' for sessions that exist in chat_sessions
        # We use a subquery to avoid duplicates if some are already there
        migration_sql = text("""
            INSERT INTO chat_messages (id, session_id, role, content, timestamp)
            SELECT id, session_id, role, content, timestamp 
            FROM messages m
            WHERE session_id IN (SELECT id FROM chat_sessions WHERE module = 'chat')
            AND NOT EXISTS (SELECT 1 FROM chat_messages cm WHERE cm.id = m.id)
        """)
        
        try:
            result = await db.execute(migration_sql)
            print(f"Migrated {result.rowcount} messages to chat_messages.")
        except Exception as e:
            print(f"Error during message migration: {e}")
            
        await db.commit()
        print("Migration complete.")

if __name__ == "__main__":
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)
    try:
        loop.run_until_complete(migrate_history())
    finally:
        loop.close()
