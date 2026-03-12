import asyncio
import logging
import sys
import os

sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

from app.services.web_search_service import web_search_service  # type: ignore

logging.basicConfig(level=logging.INFO, stream=sys.stdout)

async def test():
    with open("python_test_out.txt", "w", encoding="utf-8") as f:
        f.write("Testing WebSearchService...\n")
        res = await web_search_service.search("agentic ai")
        f.write(f"Results len: {len(res.get('results', []))}\n")
        for r in res.get("results", []):
            f.write(f"--- \nTitle: {r['title']}\nURL: {r['url']}\nDomain: {r['domain']}\nScore: {r['score']}\n")
            f.write(f"Snippet length: {len(r.get('snippet', ''))}\n")
            f.write(f"Snippet preview: {r.get('snippet', '').replace(chr(10), ' ')[:100]}...\n\n")

if __name__ == "__main__":
    asyncio.run(test())
