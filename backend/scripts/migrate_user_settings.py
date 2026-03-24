import asyncio
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy import text
from app.core.config import get_settings

async def main():
    settings = get_settings()
    engine = create_async_engine(settings.DATABASE_URL)
    async with engine.begin() as conn:
        try:
            await conn.execute(text("ALTER TABLE users ADD COLUMN nickname VARCHAR(100);"))
            print("Added nickname")
        except Exception as e:
            print(f"Error nickname: {e}")
        
        try:
            await conn.execute(text("ALTER TABLE users ADD COLUMN occupation VARCHAR(150);"))
            print("Added occupation")
        except Exception as e:
            print(f"Error occupation: {e}")
            
        try:
            await conn.execute(text("ALTER TABLE users ADD COLUMN about_me VARCHAR(1000);"))
            print("Added about_me")
        except Exception as e:
            print(f"Error about_me: {e}")
            
        try:
            await conn.execute(text("ALTER TABLE users ADD COLUMN custom_instructions VARCHAR(2000);"))
            print("Added custom_instructions")
        except Exception as e:
            print(f"Error custom_instructions: {e}")

if __name__ == "__main__":
    asyncio.run(main())
