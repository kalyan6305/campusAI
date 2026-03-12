import logging
from duckduckgo_search import DDGS  # type: ignore

logging.basicConfig(level=logging.INFO)

print("Testing DDGS with lite backend...")
try:
    with DDGS() as ddgs:
        res = list(ddgs.text("agentic ai", backend="lite", max_results=5))
        print(f"Results len: {len(res)}")
        for r in res:
            print(r['href'])
            
except Exception as e:
    print(f"Error: {e}")
