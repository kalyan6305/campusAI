import asyncio
from app.db.base import engine
from sqlalchemy import inspect

async def main():
    async with engine.connect() as conn:
        tables = await conn.run_sync(lambda sync_conn: inspect(sync_conn).get_table_names())
        print(f"Tables: {tables}")
        
        # Check alembic_version specifically
        if 'alembic_version' in tables:
            stmt = "SELECT version_num FROM alembic_version"
            result = await conn.execute(stmt)
            version = result.scalar()
            print(f"Alembic version: {version}")
        else:
            print("alembic_version table not found")

if __name__ == "__main__":
    asyncio.run(main())
