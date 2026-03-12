import sys
import os

# Add backend directory to sys.path so we can import 'app'
current_dir = os.path.dirname(os.path.abspath(__file__))
if current_dir not in sys.path:
    sys.path.insert(0, current_dir)

import asyncio
from app.services.social_search_service import social_search_service  # type: ignore

async def main():
    try:
        print("Testing social_search_service...")
        results = await social_search_service.search("artificial intelligence")
        print(f"Total results: {len(results)}")
        for r in results:  # type: ignore
            print(f"- [{r.get('platform')}] {r.get('title')} (reliability: {r.get('reliability_score')})")
            print(f"  URL: {r.get('url')}")
    except Exception as e:
        print(f"Error during test: {e}")

if __name__ == "__main__":
    asyncio.run(main())
