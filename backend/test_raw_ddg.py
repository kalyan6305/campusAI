
from duckduckgo_search import DDGS  # type: ignore
import logging

logging.basicConfig(level=logging.INFO)

def test_raw():
    print("Testing DDG raw...")
    try:
        with DDGS() as ddgs:
            results = list(ddgs.text("hello world", max_results=5))
            print(f"Success! Found {len(results)} results.")
            for r in results:
                print(f"- {r['title']}")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    test_raw()
