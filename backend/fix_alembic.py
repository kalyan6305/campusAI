import asyncio
from sqlalchemy import text
from sqlalchemy.ext.asyncio import create_async_engine
from app.core.config import get_settings

async def fix():
    settings = get_settings()
    engine = create_async_engine(settings.DATABASE_URL)
    async with engine.begin() as conn:
        await conn.execute(text("UPDATE alembic_version SET version_num='d3504080575c'"))
    await engine.dispose()
    print("Alembic version fixed to d3504080575c")

if __name__ == "__main__":
    asyncio.run(fix())
