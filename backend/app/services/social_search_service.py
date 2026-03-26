import logging
from typing import List, Dict, Any
import httpx
from app.core.config import get_settings

logger = logging.getLogger(__name__)

class SocialSearchService:
    """
    Search service that specifically targets social media platforms
    to provide real-time community sentiment and discussions.
    """

    def __init__(self, max_results: int = 5):
        self.max_results = max_results
        self.platforms = ["reddit.com", "x.com", "linkedin.com", "quora.com", "medium.com"]

    async def search(self, query: str) -> List[Dict[str, Any]]:
        """
        Run a targeted search across social platforms.
        """
        settings = get_settings()
        api_key = settings.SERPER_API_KEY
        
        if not api_key:
            logger.warning("No SERPER_API_KEY found for SocialSearchService.")
            return []
            
        # Construct a query restricted to social sites
        site_restriction = " OR ".join([f"site:{site}" for site in self.platforms])
        social_query = f"({query}) ({site_restriction})"
        
        url = "https://google.serper.dev/search"
        headers = {
            'X-API-KEY': api_key,
            'Content-Type': 'application/json'
        }
        payload = {"q": social_query, "num": self.max_results}
        
        results = []
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.post(url, headers=headers, json=payload)
                response.raise_for_status()
                data = response.json()
                
                organic = data.get("organic", [])
                for r in organic:
                    link = r.get("link", "")
                    domain = link.split("//")[-1].split("/")[0] if link else "unknown"
                    results.append({
                        "source": domain,
                        "title": r.get("title", ""),
                        "snippet": r.get("snippet", ""),
                        "link": link,
                        "category": "Social",
                    })
        except Exception as exc:
            logger.error("SocialSearchService Serper API error: %s", exc)
            
        return results

social_search_service = SocialSearchService()
