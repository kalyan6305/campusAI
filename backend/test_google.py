from googlesearch import search  # type: ignore
import time
import sys

def test_google():
    print("Testing basic google search...")
    try:
        results = list(search("agentic ai site:wikipedia.org", lang="en", sleep_interval=2, num_results=5, advanced=True))
        print(f"Results len: {len(results)}")
        for r in results:
            print("URL:", r.url)
            print("Title:", r.title)
            print("Desc:", r.description)
            print("---")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    test_google()
