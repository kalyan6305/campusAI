import httpx  # type: ignore
from bs4 import BeautifulSoup  # type: ignore
import urllib.parse
import asyncio

async def test():
    query = "site:wikipedia.org agentic ai"
    url = f"https://html.duckduckgo.com/html/?q={urllib.parse.quote(query)}"
    
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/115.0",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.5",
    }
    
    async with httpx.AsyncClient() as client:
        resp = await client.get(url, headers=headers, follow_redirects=True)
        print("Status Code:", resp.status_code)
        if resp.status_code == 200:
            soup = BeautifulSoup(resp.text, 'lxml')
            results = soup.find_all('a', class_='result__snippet')
            print(f"Parsed {len(results)} results")
            for res in results:
                print(res.get('href'))

asyncio.run(test())
