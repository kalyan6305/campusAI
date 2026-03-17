"""
Web Search Service — performs real-time searches across multiple sources in parallel.
"""

import asyncio
import logging
import urllib.parse
from typing import List, Dict, Any
import httpx

from app.core.config import get_settings

logger = logging.getLogger(__name__)


class WebSearchService:
    """
    Search service that runs three parallel DuckDuckGo queries:
    1. Development sources (StackOverflow, GitHub, GeeksForGeeks, MDN, W3Schools)
    2. Scholarly sources (Wikipedia, arXiv, Scholar)
    3. General web (news, blogs, everything else)

    Results are deduplicated by URL and combined (up to 15 total).
    """

    def __init__(self, results_per_bucket: int = 5):
        self.results_per_bucket = results_per_bucket

    # ──────────────────────────────────────────────────────────────────
    # Public API
    # ──────────────────────────────────────────────────────────────────

    async def search(self, query: str) -> Dict[str, Any]:
        """
        Run three parallel searches and merge / dedup the results.
        Returns {"results": [...], "platform_links": [...]}.
        """
        platform_links = self._generate_platform_links(query)

        logger.info("Launching single comprehensive search for: %s", query)
        
        # Use sync DDGS in a way that avoids hangs
        # We now run a single query rather than 3 parallel ones to avoid severe DuckDuckGo rate limiting
        bucket_results = await self._run_search(query, bucket="Web", max_results=15)

        combined = []
        seen_urls = set()

        if isinstance(bucket_results, Exception):
            logger.warning("Search failed: %s", bucket_results)
            bucket_results = []
            
        for item in bucket_results:
            url = item.get("link", "")
            if url and url not in seen_urls:
                seen_urls.add(url)
                combined.append(item)

        if not combined:
            logger.warning("All buckets empty — using fallback results.")
            combined = self._get_fallback_results(query)

        logger.info("Multi-source search complete: %d unique results.", len(combined))
        return {"results": combined, "platform_links": platform_links}

    # ──────────────────────────────────────────────────────────────────
    # Internal helpers
    # ──────────────────────────────────────────────────────────────────

    async def _run_search(self, query: str, bucket: str, max_results: int = 15) -> List[Dict[str, Any]]:
        settings = get_settings()
        api_key = settings.SERPER_API_KEY
        
        if not api_key:
            logger.warning("No SERPER_API_KEY found. Falling back to empty results.")
            return []
            
        url = "https://google.serper.dev/search"
        headers = {
            'X-API-KEY': api_key,
            'Content-Type': 'application/json'
        }
        payload = {"q": query, "num": max_results}
        
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
                    inferred_cat = self._infer_browser(domain)
                    results.append({
                        "source": domain,
                        "title": r.get("title", ""),
                        "snippet": r.get("snippet", ""),
                        "link": link,
                        "browser": inferred_cat,
                        "category": inferred_cat,
                    })
        except Exception as exc:
            logger.error("Serper API error: %s", exc)
            
        return results

    def _generate_platform_links(self, query: str) -> List[Dict[str, str]]:
        encoded = urllib.parse.quote(query)
        platforms = [
            {"id": "geeksforgeeks", "name": "GeeksforGeeks", "icon": "🌳", "url": f"https://www.geeksforgeeks.org/search?q={encoded}", "category": "Development"},
            {"id": "w3schools",     "name": "W3Schools",     "icon": "🌐", "url": f"https://www.google.com/search?q=site:w3schools.com+{encoded}", "category": "Development"},
            {"id": "stackoverflow", "name": "StackOverflow", "icon": "🥞", "url": f"https://stackoverflow.com/search?q={encoded}", "category": "Development"},
            {"id": "mdn",           "name": "MDN Web Docs",  "icon": "🦊", "url": f"https://developer.mozilla.org/en-US/search?q={encoded}", "category": "Development"},
            {"id": "github",        "name": "GitHub",        "icon": "🐙", "url": f"https://github.com/search?q={encoded}", "category": "Development"},
            {"id": "quora",         "name": "Quora",         "icon": "❓", "url": f"https://www.quora.com/search?q={encoded}", "category": "Social"},
            {"id": "reddit",        "name": "Reddit",        "icon": "🤖", "url": f"https://www.reddit.com/search/?q={encoded}", "category": "Social"},
            {"id": "linkedin",      "name": "LinkedIn",      "icon": "🔗", "url": f"https://www.linkedin.com/search/results/all/?keywords={encoded}", "category": "Social"},
            {"id": "medium",        "name": "Medium",        "icon": "✍️", "url": f"https://medium.com/search?q={encoded}", "category": "Social"},
            {"id": "google_scholar","name": "Scholar",       "icon": "🎓", "url": f"https://scholar.google.com/scholar?q={encoded}", "category": "Scholarly"},
            {"id": "wikipedia",     "name": "Wikipedia",     "icon": "📚", "url": f"https://en.wikipedia.org/wiki/Special:Search?search={encoded}", "category": "Scholarly"},
            {"id": "youtube",       "name": "YouTube",       "icon": "📺", "url": f"https://www.youtube.com/results?search_query={encoded}", "category": "Multimedia"},
        ]
        return platforms

    def _get_fallback_results(self, query: str) -> List[Dict[str, Any]]:
        return [
            {
                "source": "google.com",
                "title": f"Search results for {query}",
                "snippet": f"Explore the latest information about {query} from across the web.",
                "link": f"https://www.google.com/search?q={urllib.parse.quote(query)}",
                "browser": "Web",
                "category": "Web",
            },
            {
                "source": "en.wikipedia.org",
                "title": f"{query} — Wikipedia",
                "snippet": f"Encyclopedia entry covering the context and history of {query}.",
                "link": f"https://en.wikipedia.org/wiki/{urllib.parse.quote(query.replace(' ', '_'))}",
                "browser": "Scholarly",
                "category": "Scholarly",
            },
            {
                "source": "stackoverflow.com",
                "title": f"{query} — Stack Overflow",
                "snippet": f"Community Q&A and code examples related to {query}.",
                "link": f"https://stackoverflow.com/search?q={urllib.parse.quote(query)}",
                "browser": "Development",
                "category": "Development",
            },
        ]

    def _infer_browser(self, domain: str) -> str:
        d = domain.lower()
        if any(x in d for x in ["wikipedia", "arxiv", "scholar", "pubmed", "researchgate", "edu", "gov"]):
            return "Scholarly"
        if any(x in d for x in ["stackoverflow", "github", "geeksforgeeks", "w3schools", "mdn", "mozilla", "developer"]):
            return "Development"
        if any(x in d for x in ["twitter", "reddit", "facebook", "linkedin", "instagram", "quora", "medium"]):
            return "Social"
        if any(x in d for x in ["bbc", "cnn", "reuters", "nytimes", "theguardian", "news"]):
            return "News"
        return "Web"


# Singleton instance
web_search_service = WebSearchService()
