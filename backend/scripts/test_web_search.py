import asyncio
import os
import sys

# Add the project root to sys.path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.services.web_search_service import web_search_service

async def test_search():
    query = "explain about computer networks"
    print(f"\n--- Testing Web Search for: '{query}' ---")
    
    try:
        # Set a timeout for the entire test to avoid hanging the script
        result = await asyncio.wait_for(web_search_service.search(query), timeout=30.0)
        
        results = result.get("results", [])
        platform_links = result.get("platform_links", [])
        
        print(f"Total results found: {len(results)}")
        for i, res in enumerate(results[:5]):
            print(f"[{i+1}] {res['title']} ({res['source']})")
        
        if len(results) > 0:
            print("\n✅ SUCCESS: Search returned results successfully.")
        else:
            print("\n⚠️ WARNING: Search returned no results (but didn't hang).")
            
        if len(platform_links) > 0:
            print(f"✅ SUCCESS: Platform links generated ({len(platform_links)}).")
        else:
            print("\n❌ FAILED: No platform links generated.")

    except asyncio.TimeoutError:
        print("\n❌ FAILED: Search timed out after 30 seconds.")
    except Exception as e:
        print(f"\n❌ FAILED: An error occurred: {e}")

if __name__ == "__main__":
    asyncio.run(test_search())
