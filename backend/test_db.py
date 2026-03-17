import asyncio
from sqlalchemy.ext.asyncio import create_async_engine
from app.core.config import get_settings

async def test_db():
    try:
        settings = get_settings()
        print(f"Connecting to: {settings.DATABASE_URL}")
        engine = create_async_engine(settings.DATABASE_URL)
        async with engine.begin() as conn:
            print("Successfully connected to the database!")
            await conn.run_sync(lambda sync_conn: print("Sync conn works!"))
        await engine.dispose()
    except Exception as e:
        print(f"Database connection failed: {e}")

if __name__ == "__main__":
    asyncio.run(test_db())
