import asyncio
import sys
import os

sys.path.append('d:\\projects\\campus_ai\\backend')

from sqlalchemy import select
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker
from app.models import ToolsSession, ToolsMessage
import httpx
from dotenv import load_dotenv

load_dotenv()

SERPER_API_KEY = os.getenv("SERPER_API_KEY")

async def search_query(query: str):
    url = "https://google.serper.dev/search"
    payload = {"q": query}
    headers = {
        'X-API-KEY': SERPER_API_KEY,
        'Content-Type': 'application/json'
    }
    
    async with httpx.AsyncClient() as client:
        response = await client.post(url, headers=headers, json=payload)
        response.raise_for_status()
        data = response.json()
        
        raw_results = data.get("organic", [])
        return [{
            "title": r.get("title"),
            "link": r.get("link"),
            "snippet": r.get("snippet"),
            "source": r.get("source", "Web"),
            "category": "Web"
        } for r in raw_results][:5]

async def main():
    DATABASE_URL = os.getenv("DATABASE_URL")
    if DATABASE_URL is None:
        raise ValueError("DATABASE_URL is not set")
        
    engine = create_async_engine(DATABASE_URL)
    async_session = async_sessionmaker(engine, expire_on_commit=False)
    
    async with async_session() as db:
        query = select(ToolsSession).options(selectinload(ToolsSession.messages))
        result = await db.execute(query)
        sessions = result.scalars().all()
        
        for session in sessions:
            messages = session.messages
            sorted_messages = sorted(messages, key=lambda m: m.timestamp)
            for i, msg in enumerate(sorted_messages):
                if msg.role == 'assistant' and msg.meta_data is None:
                    # Find the preceding user message to use as the query
                    if i > 0 and sorted_messages[i-1].role == 'user':
                        user_query = sorted_messages[i-1].content
                        print(f'Backfilling session {session.id}, message {msg.id} with query: {user_query}')
                        try:
                            search_results = await search_query(user_query)
                            if search_results:
                                msg.meta_data = {'sources': search_results, 'platform_links': []}
                                print(f'  Added {len(search_results)} sources')
                        except Exception as e:
                            print(f'  Error searching for {user_query}: {e}')
        
        await db.commit()
    
    await engine.dispose()
    print('Finished backfilling.')

if __name__ == '__main__':
    asyncio.run(main())
