
import asyncio
import logging
import sys
import os

# Add backend to path
sys.path.append(os.path.join(os.getcwd(), "backend"))

from app.services.web_search_service import WebSearchService  # type: ignore

logging.basicConfig(level=logging.INFO)

async def test_search():
    service = WebSearchService()
    query = "explain types of prompt engineering"
    print(f"\n--- Testing Query: {query} ---\n")
    
    results = await service.search(query)
    
    sources = results.get("sources", [])
    print(f"\nFound {len(sources)} sources:")
    for i, s in enumerate(sources):
        print(f"[{i+1}] {s['title']} ({s['domain']}) - {s['category']}")
        print(f"    URL: {s['url']}")
        print(f"    Score: {s['score']}")

if __name__ == "__main__":
    asyncio.run(test_search())
