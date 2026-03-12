import asyncio
import logging
import re
import urllib.parse
from datetime import datetime, timezone
from typing import List, Dict, Any, Optional

import httpx  # type: ignore

from app.core.config import get_settings  # type: ignore
from app.services.web_search_service import SerperSearchService  # type: ignore

logger = logging.getLogger(__name__)

def compute_reliability_score(url: str, metadata: Dict[str, Any], snippet: str) -> int:
    """
    Computes a reliability score (0-100) based on domain reputation,
    engagement signals, content richness, and recency.
    """
    score = 50  # Base score
    url_lower = url.lower()

    # 1. Domain Reputation
    if "wikipedia.org" in url_lower:
        score += 20
    elif ".edu" in url_lower or ".ac.uk" in url_lower or "arxiv.org" in url_lower:
        score += 15
    elif "github.com" in url_lower or "stackoverflow.com" in url_lower:
        score += 10
    elif "reddit.com" in url_lower or "hackernews.com" in url_lower or "ycombinator.com" in url_lower:
        score += 10
    elif "linkedin.com" in url_lower:
        score += 15
    
    # 2. Engagement Signals (Views, Upvotes, Comments)
    views = metadata.get("views", 0)
    if isinstance(views, (int, float)):
        if views > 1000000:
            score += 15
        elif views > 100000:
            score += 10
        elif views > 10000:
            score += 5

    upvotes = metadata.get("upvotes", 0)
    if isinstance(upvotes, (int, float)):
        if upvotes > 500:
            score += 15
        elif upvotes > 200:
            score += 10
        elif upvotes > 50:
            score += 5

    comments = metadata.get("comments", 0)
    if isinstance(comments, (int, float)) and comments > 100:
        score += 5

    # 3. Content Richness
    snippet_length = len(snippet or "")
    if snippet_length > 300:
        score += 10
    elif snippet_length > 150:
        score += 5
        
    # 4. Recency (if provided as ISO string or timestamp)
    published_at = metadata.get("published_at")
    if published_at:
        try:
            if isinstance(published_at, str):
                # Simple heuristic for recent years
                if "2024" in published_at or "2025" in published_at or "2026" in published_at:
                    score += 5
            elif isinstance(published_at, (int, float)):
                 # Assuming unix timestamp
                 now = datetime.now(timezone.utc).timestamp()
                 if (now - published_at) < (365 * 24 * 3600): # within a year
                     score += 5
        except Exception:
            pass

    return min(max(score, 0), 100)


class SocialSearchService:
    """
    Asynchronous search service across YouTube, HackerNews, and Wikipedia.
    Normalizes results to a standard source format with reliability scoring.
    """

    def __init__(self):
        settings = get_settings()
        self.youtube_api_key = settings.YOUTUBE_API_KEY
        self._http_client = httpx.AsyncClient(timeout=10.0)
        self.serper = SerperSearchService()

    async def search(self, query: str) -> List[Dict[str, Any]]:
        """
        Executes parallel searches across all configured platforms.
        """
        logger.info(f"SocialSearchService: Starting parallel search for '{query}'")
        
        tasks = [
            self._search_wikipedia(query),
            self._search_hackernews(query),
            self._search_via_serper(query, "reddit", "site:reddit.com"),
            self._search_via_serper(query, "quora", "site:quora.com"),
            self._search_via_serper(query, "linkedin", "site:linkedin.com/pulse OR site:linkedin.com/in"),
            self._search_via_serper(query, "arxiv", "site:arxiv.org")
        ]
        
        if self.youtube_api_key:
            tasks.append(self._search_youtube(query))
        else:
            logger.warning("YOUTUBE_API_KEY not found. Skipping YouTube search.")

        results = await asyncio.gather(*tasks, return_exceptions=True)
        
        all_sources = []
        for i, res in enumerate(results):
            if isinstance(res, Exception):
                logger.error(f"Error in social search task {i}: {res}")
            elif isinstance(res, list):
                logger.info(f"Task {i} returned {len(res)} results")
                all_sources.extend(res)
                
        # Sort by reliability score descending
        all_sources.sort(key=lambda x: x.get("reliability_score", 0), reverse=True)
        logger.info(f"SocialSearchService returning total {len(all_sources)} sources")
        return all_sources

    def _normalize_source(
        self, 
        title: str, 
        url: str, 
        platform: str, 
        snippet: str, 
        metadata: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """Creates a standardized source object with computed reliability."""
        metadata = metadata or {}
        # Clean snippet
        clean_snippet = re.sub(r'<[^>]+>', '', snippet)  # basic HTML strip
        clean_snippet = clean_snippet.replace('\n', ' ').strip()
        
        score = compute_reliability_score(url, metadata, clean_snippet)
        
        return {
            "title": title,
            "url": url,
            "platform": platform,
            "snippet": clean_snippet,
            "metadata": metadata,
            "reliability_score": score,
            "agreement_score": 0 # Computed later by ResearchService
        }

    async def _search_wikipedia(self, query: str) -> List[Dict[str, Any]]:
        """Searches Wikipedia using their public API (Max 3 results)."""
        clean_q = urllib.parse.quote(query)
        url = f"https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch={clean_q}&utf8=&format=json"
        
        try:
            resp = await self._http_client.get(url)
            if resp.status_code == 200:
                data = resp.json()
                search_hits = data.get("query", {}).get("search", [])
                
                sources = []
                for hit in search_hits[:3]:
                    title = hit["title"]
                    encoded_title = urllib.parse.quote(title.replace(" ", "_"))
                    link = f"https://en.wikipedia.org/wiki/{encoded_title}"
                    snippet = hit.get("snippet", "")
                    
                    sources.append(self._normalize_source(
                        title=title,
                        url=link,
                        platform="wikipedia",
                        snippet=snippet,
                        metadata={"wordcount": hit.get("wordcount", 0)}
                    ))
                return sources
        except Exception as e:
            logger.error(f"Wikipedia search error: {e}")
            
        return []

    async def _search_hackernews(self, query: str) -> List[Dict[str, Any]]:
        """Searches HackerNews using Algolia API (Max 5 results)."""
        clean_q = urllib.parse.quote(query)
        # Sort by relevance, searching stories
        url = f"https://hn.algolia.com/api/v1/search?query={clean_q}&tags=story&hitsPerPage=5"
        
        try:
            resp = await self._http_client.get(url)
            if resp.status_code == 200:
                data = resp.json()
                hits = data.get("hits", [])
                
                sources = []
                for hit in hits:
                    title = hit.get("title", "")
                    object_id = hit.get("objectID", "")
                    link = hit.get("url") or f"https://news.ycombinator.com/item?id={object_id}"
                    
                    # Try to get story text, otherwise use title as snippet
                    snippet = hit.get("story_text") or title
                    
                    sources.append(self._normalize_source(
                        title=title,
                        url=link,
                        platform="hackernews",
                        snippet=snippet,
                        metadata={
                            "upvotes": hit.get("points", 0),
                            "comments": hit.get("num_comments", 0),
                            "author": hit.get("author", ""),
                            "published_at": hit.get("created_at_i", 0) # unix timestamp
                        }
                    ))
                return sources
        except Exception as e:
            logger.error(f"HackerNews search error: {e}")
            
        return []

    async def _search_youtube(self, query: str) -> List[Dict[str, Any]]:
        """Searches YouTube using Data API v3 (Max 5 results)."""
        if not self.youtube_api_key:
            return []
            
        clean_q = urllib.parse.quote(query)
        url = f"https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=5&q={clean_q}&type=video&key={self.youtube_api_key}"
        
        try:
            resp = await self._http_client.get(url)
            if resp.status_code == 200:
                data = resp.json()
                items = data.get("items", [])
                
                sources = []
                for item in items:
                    video_id = item["id"]["videoId"]
                    snippet_data = item.get("snippet", {})
                    title = snippet_data.get("title", "")
                    description = snippet_data.get("description", "")
                    channel = snippet_data.get("channelTitle", "")
                    
                    link = f"https://www.youtube.com/watch?v={video_id}"
                    
                    # Note: We can't get views/likes from the 'search' endpoint easily
                    # without making a secondary 'videos' request. For speed, we estimate or skip.
                    
                    sources.append(self._normalize_source(
                        title=f"{title} ({channel})",
                        url=link,
                        platform="youtube",
                        snippet=description,
                        metadata={
                            "channel": channel,
                            "published_at": snippet_data.get("publishedAt", "")
                        }
                    ))
                return sources
            else:
                 logger.error(f"YouTube API returned status {resp.status_code}")
        except Exception as e:
            logger.error(f"YouTube search error: {e}")
            
        return []

    async def _search_via_serper(self, query: str, platform: str, site_filter: str) -> List[Dict[str, Any]]:
        """Uses Serper Dev API (Google) to find results for specific platforms."""
        if not self.serper.api_key:
            return []
            
        full_query = f"{site_filter} {query}"
        try:
            results = await self.serper.search(full_query, num=3)
            
            sources = []
            for r in results:
                title = r.get("title", "")
                link = r.get("link", "")
                snippet = r.get("snippet", "")
                
                # Try to extract pseudo-metadata from snippet
                metadata = {}
                if platform == "reddit":
                    upvotes_match = re.search(r"(\d+k?)\s+votes", snippet, re.IGNORECASE)
                    if upvotes_match:
                        val = upvotes_match.group(1).lower().replace('k', '000')
                        try:
                            metadata["upvotes"] = int(val)
                        except:
                            pass
                
                sources.append(self._normalize_source(
                    title=title,
                    url=link,
                    platform=platform,
                    snippet=snippet,
                    metadata=metadata
                ))
            return sources
        except Exception as e:
            logger.error(f"{platform} serper search error: {e}")
        return []

social_search_service = SocialSearchService()
