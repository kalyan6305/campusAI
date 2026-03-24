import asyncio
from sqlalchemy import text
from app.db.base import async_session_factory
from app.core.config import get_settings

async def migrate():
    settings = get_settings()
    print(f"Migrating database: {settings.DATABASE_URL.split('@')[-1]}")
    
    async with async_session_factory() as session:
        # SQL commands for MySQL
        commands = [
            "ALTER TABLE users ADD COLUMN appearance VARCHAR(20) DEFAULT 'system';",
            "ALTER TABLE users ADD COLUMN accent_color VARCHAR(30) DEFAULT 'blue';",
            "ALTER TABLE users ADD COLUMN language VARCHAR(20) DEFAULT 'english';"
        ]
        
        for cmd in commands:
            try:
                await session.execute(text(cmd))
                print(f"Executed: {cmd}")
            except Exception as e:
                print(f"Skipped (likely exists): {str(e)}")
        
        await session.commit()
    print("Migration finished.")

if __name__ == "__main__":
    asyncio.run(migrate())
