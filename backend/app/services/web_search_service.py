import asyncio
import logging
import random
import re
import urllib.parse
import concurrent.futures
import json
from typing import List, Dict, Any, Optional

import httpx  # type: ignore
from bs4 import BeautifulSoup  # type: ignore
from duckduckgo_search import DDGS  # type: ignore

from app.core.config import get_settings  # type: ignore
try:
    from googlesearch import search as gsearch  # type: ignore
except ImportError:
    gsearch = None

logger = logging.getLogger(__name__)

class SerperSearchService:
    """
    Search service using the Serper.dev API (Google Search).
    """

    def __init__(self, api_key: Optional[str] = None):
        settings = get_settings()
        self.api_key = api_key or settings.SERPER_API_KEY
        self.url = "https://google.serper.dev/search"
        self._http_client = httpx.AsyncClient(timeout=15.0)

    async def search(self, query: str, num: int = 10) -> List[Dict[str, Any]]:
        if not self.api_key:
            logger.warning("Serper API key not found. Skipping Serper search.")
            return []

        headers = {
            "X-API-KEY": self.api_key,
            "Content-Type": "application/json"
        }
        payload = json.dumps({"q": query, "num": num})

        try:
            resp = await self._http_client.post(self.url, headers=headers, data=payload)
            if resp.status_code == 200:
                data = resp.json()
                results = []
                # Organic results
                for r in data.get("organic", []):
                    results.append({
                        "title": r.get("title", ""),
                        "link": r.get("link", ""),
                        "snippet": r.get("snippet", ""),
                        "domain": urllib.parse.urlparse(r.get("link", "")).netloc.replace("www.", ""),
                        "category": "Web"
                    })
                return results
            else:
                logger.error(f"Serper API error: {resp.status_code} - {resp.text}")
                return []
        except Exception as e:
            logger.error(f"Error during Serper search: {e}")
            return []

class WebSearchService:
    """
    Perplexity-style Deep Research Pipeline.
    """

    # ... existing tiers and weights ...
    
    def __init__(self, top_k: int = 15):
        self.top_k = top_k
        self._executor = concurrent.futures.ThreadPoolExecutor(max_workers=5)
        self.serper = SerperSearchService()  # type: ignore
        self._all_known_domains = self._TIER_1_DOMAINS | self._TIER_2_DOMAINS | self._TIER_3_DOMAINS
        whitelist_list = list(self._all_known_domains)
        logger.info(f"Initialized WebSearchService with {len(whitelist_list)} whitelisted domains")
        self._http_client = httpx.AsyncClient(
            timeout=15.0, 
            follow_redirects=True,
            headers={
                "User-Agent": "CampusAI-ResearchBot/1.1 (contact: support@campus.ai) Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
                "Accept": "application/json, text/html, */*",
                "Accept-Language": "en-US,en;q=0.9"
            }
        )

    # --- Search Intelligence Layer Constants ---
    
    # Tier 1 (Highest): Official documentation, Academic papers, Standards orgs
    _TIER_1_DOMAINS = {
        "wikipedia.org", "en.wikipedia.org", "developer.mozilla.org", "w3schools.com",
        "arxiv.org", "python.org", "matplotlib.org", "numpy.org", "pandas.pydata.org",
        "scikit-learn.org", "pytorch.org", "tensorflow.org", "openai.com", 
        "microsoft.com", "ibm.com", "cloud.google.com", "aws.amazon.com",
        "apple.com", "kubernetes.io", "docker.com", "anthropic.com", "cohere.com",
        "mistral.ai", "huggingface.co", "arxiv.org"
    }
    
    # Tier 2: Technical education platforms and AI focused blogs
    _TIER_2_DOMAINS = {
        "geeksforgeeks.org", "realpython.com", "towardsdatascience.com",
        "tutorialspoint.com", "programiz.com", "digitalocean.com",
        "coursera.org", "deeplearning.ai", "ibm.com", "nvidia.com",
        "oracle.com", "redhat.com", "freecodecamp.org", "guru99.com",
        "javatpoint.com", "baeldung.com", "spring.io", "learnprompting.org",
        "promptingguide.ai", "promptengineering.org"
    }
    
    # Tier 3: Community knowledge and high-quality tech blogs
    _TIER_3_DOMAINS = {
        "stackoverflow.com", "github.com", "medium.com", "reddit.com",
        "dev.to", "hashnode.com", "hackernoon.com", "infoq.com"
    }

    _DOMAIN_WEIGHTS = {
        # Tier 1
        "wikipedia": 100, "python.org": 98, "matplotlib.org": 98, "numpy.org": 98,
        "pytorch.org": 98, "tensorflow.org": 98, "developer.mozilla.org": 95,
        "microsoft.com": 90, "aws.amazon.com": 90, "cloud.google.com": 90,
        "ibm.com": 90, "openai.com": 90, "arxiv.org": 85,
        # Tier 2
        "geeksforgeeks.org": 80, "realpython.com": 80, "w3schools.com": 75,
        # Tier 3
        "stackoverflow.com": 70, "github.com": 65, "medium.com": 60,
        "towardsdatascience.com": 60, "reddit.com": 50
    }

    _NOISE_PARAMS = {
        "utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content",
        "ref", "referrer", "source", "clickId", "fbclid", "gclid",
        "msclkid", "mc_cid", "mc_eid", "_ga", "igshid", "yclid", "srsltid"
    }


    # ──────────────────────────────────────────────────────────────────
    # Public API
    # ──────────────────────────────────────────────────────────────────

    async def search(self, query: str) -> Dict[str, Any]:
        """
        Executes the full research pipeline and returns ranked, extracted sources.
        """
        logger.info("Step 1: Generating query variations for '%s'", query)
        variations = self._generate_variations(query)

        logger.info("Step 2: Searching authoritative platforms")
        raw_results = await self._run_parallel_searches(variations, query)

        logger.info("Step 3: Validating URLs and removing duplicates")
        valid_sources = self._validate_and_deduplicate(raw_results)

        logger.info("Step 4: Ranking sources")
        ranked_sources = list(self._rank_sources(valid_sources))[:int(self.top_k)]  # type: ignore

        logger.info("Step 5: Content Extraction for Top %d URLs", len(ranked_sources))
        extracted_sources = await self._extract_content_for_all(ranked_sources)

        # Standardize strictly to the Search Intelligence Layer Format:
        # { sources: [ { title, url, domain, category, score } ] }
        final_sources = []
        for src in extracted_sources:
            # Map category from tiered domains
            domain = src["domain"]
            category = "Web"
            if any(d in domain for d in self._TIER_1_DOMAINS):
                category = "Documentation" if "mdn" in domain or "docs" in domain else "Research"
                if "wikipedia" in domain: category = "Research"
            elif any(d in domain for d in self._TIER_2_DOMAINS):
                category = "Web"
            elif any(d in domain for d in self._TIER_3_DOMAINS):
                category = "Social" if "reddit" in domain else "Web"

            final_sources.append({
                "title": src["title"],
                "url": src["link"],
                "domain": src["domain"],
                "category": category,
                "score": src["score"]
            })

        logger.info("Search Intelligence completion. Returning %d verified sources.", len(final_sources))
        return {"sources": final_sources}

    # ──────────────────────────────────────────────────────────────────
    # Pipeline Steps
    # ──────────────────────────────────────────────────────────────────

    def _generate_variations(self, base_query: str) -> List[str]:
        # Step 1: Query Understanding
        cleaned = base_query.replace("?", "").strip()
        return [
            f"{cleaned} explained",
            f"{cleaned} architecture",
            f"what is {cleaned}",
            f"{cleaned} tutorial",
            f"{cleaned} examples"
        ]

    async def _run_parallel_searches(self, queries: List[str], original_query: str) -> List[Dict[str, Any]]:
        # Limit to 1-2 concurrent tasks to avoid aggressive flagging
        search_query_list = [
            # Tier 1 & 2 Focus
            f"(site:wikipedia.org OR site:python.org OR site:developer.mozilla.org OR site:geeksforgeeks.org) {queries[0]}",
            # Community Focus
            f"(site:stackoverflow.com OR site:github.com OR site:reddit.com) {queries[1]}" if len(queries) > 1 else f"site:github.com {queries[0]}",
            # Broad Tech Focus
            f"technical article {original_query}"
        ]
        
        all_raw = []
        for q in search_query_list:
            is_broad = "site:" not in q
            results = await self._run_single_search(q, "Web" if is_broad else "Scholarly")
            all_raw.extend(results)
            if len(all_raw) < 15: # Stop early if we have enough
                await asyncio.sleep(random.uniform(1.0, 2.0)) 

        # Final fallbacks if targeted searches yield nothing
        if not all_raw:
            logger.info("Targeted searches failed. Attempting Wikipedia Fallback.")
            wiki_results = await self._try_wikipedia_fallback(original_query)
            all_raw.extend(wiki_results)
            
            if not all_raw:
                logger.info("Wikipedia failed. Performing absolute broad fallback.")
                all_raw = await self._run_single_search(original_query, "General")
            
        return all_raw

    async def _try_wikipedia_fallback(self, query: str) -> List[Dict[str, Any]]:
        """Direct call to Wikipedia API as a highly reliable fallback."""
        try:
            # Try both the literal query and a pruned version
            searches = [query, query.split()[-1], query.split()[0]]
            for q in searches:
                clean_q = urllib.parse.quote(q)
                wiki_api_url = f"https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch={clean_q}&utf8=&format=json"
                logger.info(f"Wiki lookup for: {q}")
                resp = await self._http_client.get(wiki_api_url)
                if resp.status_code == 200:
                    data = resp.json()
                    search_hits = data.get("query", {}).get("search", [])
                    if not search_hits: 
                        logger.info(f"No Wiki hits for: {q}")
                        continue
                    
                    logger.info(f"Wiki found {len(search_hits)} hits for: {q}")
                    results = []
                    for hit in search_hits[:5]:
                        title = hit["title"]
                        encoded_title = urllib.parse.quote(title.replace(" ", "_"))
                        link = f"https://en.wikipedia.org/wiki/{encoded_title}"
                        results.append({
                            "title": title,
                            "link": link,
                            "snippet": hit.get("snippet", "").replace('<span class="searchmatch">', '').replace('</span>', ''),
                            "category": "Research"
                        })
                    return results
        except Exception as e:
            logger.warning(f"Wikipedia fallback failed: {e}")
        return []

    async def _run_single_search(self, query: str, category: str) -> List[Dict[str, Any]]:
        # Priority 1: Serper API (Most reliable if API key is present)
        results = await self.serper.search(query)  # type: ignore
        if results:
            for r in results:
                r["category"] = category
            return results

        # Priority 2: DuckDuckGo (No API key needed)
        try:
            loop = asyncio.get_event_loop()
            results = await loop.run_in_executor(self._executor, self._sync_ddg, query, category)
        except Exception as e:
            logger.warning(f"DDG Search failed for '{query}': {e}")

        # Priority 3: Google Fallback (googlesearch-python)
        if not results and gsearch:
            logger.info(f"Triggering Google Fallback for '{query}'")
            try:
                loop = asyncio.get_event_loop()
                results = await loop.run_in_executor(self._executor, self._sync_google, query, category)
            except Exception as e:
                logger.warning(f"Google Fallback failed for '{query}': {e}")

        return results

    def _sync_google(self, query: str, category: str) -> List[Dict[str, Any]]:
        results = []
        if not gsearch:
            return results
        try:
            # Use advanced=True to get titles and snippets
            res_gen = gsearch(query, num_results=15, advanced=True, sleep_interval=2)
            for r in res_gen:
                results.append({
                    "title": r.title,
                    "link": r.url,
                    "snippet": r.description,
                    "category": category
                })
        except Exception as e:
            logger.error(f"Google search error: {e}")
        return results

    def _sync_ddg(self, query: str, category: str) -> List[Dict[str, Any]]:
        with DDGS() as ddgs:
            results = []
            for r in ddgs.text(query, max_results=15):
                results.append({
                    "title": r.get("title", ""),
                    "link": r.get("href", ""),
                    "snippet": r.get("body", ""),
                    "category": category
                })
        return results

    def _validate_and_deduplicate(self, raw_results: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        seen = set()
        valid = []
        for r in raw_results:
            url = r.get("link", "")
            if not self._is_valid_article_url(url):
                # logger.info(f"Filtered out URL (invalid pattern): {url}")
                continue
            
            clean = self._clean_url(url)
            if clean not in seen:
                seen.add(clean)
                parsed_clean = urllib.parse.urlparse(clean)
                domain = re.sub(r'^www\.', '', parsed_clean.netloc.lower())
                r["link"] = clean
                r["domain"] = domain
                valid.append(r)
        return valid

    def _is_valid_article_url(self, url: str) -> bool:
        if not url or not url.startswith("https"):
            return False
            
        try:
            parsed = urllib.parse.urlparse(url)
            # Safer way to remove www. without stripping char sets
            host = re.sub(r'^www\.', '', parsed.netloc.lower())
            
            # 1. Check if domain is in allowed tiers
            is_allowed = False
            for allowed in self._all_known_domains:
                if host == allowed or host.endswith("." + allowed):
                    is_allowed = True
                    break
            
            path = parsed.path.lower()
            segments = [s.strip() for s in path.split('/') if s.strip()]
            
            # For "General" or "Web" categories, we allow non-whitelisted domains 
            # as long as they aren't on the blocked search engine list
            # We relax it for technical-looking paths or any non-search-engine domain if in broad mode
            # Allow essentially any non-blocked domain that looks like an article
            if not is_allowed and not any(host.endswith(bad) for bad in [".google.com", ".bing.com", ".duckduckgo.com", "yandex.com", "baidu.com"]):
                # logger.info(f"Allowing external domain: {host}")
                is_allowed = True
            
            if not is_allowed:
                return False
            
            # 2. Reject homepages/roots
            if not segments or path in ("", "/", "/index.html", "/index.php"):
                return False
                
            # 3. Reject navigation/list pages (tags, categories, etc.)
            # But allow if it's a deep article (more than 2 segments)
            bad_segments = {"search", "tags", "categories", "tag", "category", "topics", "archive", "author"}
            if len(segments) <= 2:
                if any(s in bad_segments for s in segments):
                    return False
            
            # 4. Global search URL rejection
            if any(bad in url.lower() for bad in ["/search?", "/results?", "?q=", "&q="]):
                return False
                
            return True
                
            return True
        except:
            return False

    def _clean_url(self, url: str) -> str:
        try:
            parsed = urllib.parse.urlparse(url)
            qs = urllib.parse.parse_qs(parsed.query, keep_blank_values=False)
            clean_qs = {k: v for k, v in qs.items() if k.lower() not in self._NOISE_PARAMS}
            clean_query = str(urllib.parse.urlencode(clean_qs, doseq=True))
            return str(urllib.parse.urlunparse(parsed._replace(query=clean_query)))
        except:
            return url

    def _rank_sources(self, sources: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        for s in sources:
            domain_str = str(s.get("domain", ""))
            
            # Base score from weights
            base_val: int = 50
            for k, v in self._DOMAIN_WEIGHTS.items():
                if k in domain_str:
                    base_val = int(v)
                    break
            
            # Boost score based on URL depth
            boost: int = 0
            try:
                url_str = str(s.get("link", ""))
                path = urllib.parse.urlparse(url_str).path
                depth_segments = [p for p in path.split("/") if p]
                if len(depth_segments) >= 2:
                    boost = 5
            except:
                pass
                
            s["score"] = base_val + boost
            
        # Sort descending by score
        sources.sort(key=lambda x: int(x.get("score", 0)), reverse=True)
        return list(sources)

    async def _extract_content_for_all(self, sources: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        if not sources:
            return []
        tasks = [self._fetch_html(s) for s in sources]
        extracted = await asyncio.gather(*tasks)
        return list(extracted)

    async def _fetch_html(self, source: Dict[str, Any]) -> Dict[str, Any]:
        url = str(source.get("link", ""))
        try:
            resp = await self._http_client.get(url)
            if resp.status_code == 200:
                soup = BeautifulSoup(resp.text, 'lxml')
                
                # Remove junk tags
                for tag in soup(["script", "style", "nav", "footer", "aside", "header", "noscript"]):
                    tag.decompose()
                
                # Extract text
                text = soup.get_text(separator="\n", strip=True)
                
                # Cleanup whitespace
                text = re.sub(r'\n{3,}', '\n\n', text)
                
                # Limit size
                source["extracted_content"] = str(text or "")[:6000]  # type: ignore
            else:
                logger.warning(f"Failed to fetch {url}: HTTP {resp.status_code}")
                source["extracted_content"] = source.get("snippet", "")
        except Exception as e:
            logger.warning(f"Error fetching {url}: {e}")
            source["extracted_content"] = source.get("snippet", "")
            
        return source

# Singleton instance
web_search_service = WebSearchService()
