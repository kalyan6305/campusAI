import asyncio
from sqlalchemy import text
from app.db.base import engine

async def check_and_add_column():
    async with engine.connect() as conn:
        # Check if the column exists
        result = await conn.execute(text("SHOW COLUMNS FROM tools_messages LIKE 'meta_data'"))
        column_exists = result.fetchone() is not None
        
        if not column_exists:
            print("Column 'meta_data' missing. Adding it...")
            await conn.execute(text("ALTER TABLE tools_messages ADD COLUMN meta_data JSON"))
            await conn.commit()
            print("Column 'meta_data' added successfully.")
        else:
            print("Column 'meta_data' already exists.")

if __name__ == "__main__":
    asyncio.run(check_and_add_column())
