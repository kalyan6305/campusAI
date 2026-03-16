"""
Job Assistant Agent - Modular components for job discovery and resume tailoring.
"""

from __future__ import annotations
import logging
import asyncio
import io
import json
import os
import re
import uuid
import requests
import pandas as pd
from typing import List, Dict, Any
from app.llm.factory import get_llm_provider
from app.utils.web_scraper import WebScraper
from duckduckgo_search import DDGS
from fpdf import FPDF
from app.core.config import get_settings

import re

logger = logging.getLogger(__name__)

# Strict filtering constants
EXCLUDE_DOMAINS = [
    'youtube.com', 'reddit.com', 'quora.com', 'medium.com', 'github.com',
    'twitter.com', 'facebook.com', 'instagram.com', 'coursera.org', 'udemy.com',
    'stackoverflow.com', 'linkedin.com/in/', 'pinterest.com', 'tiktok.com',
    'glassdoor.com/blog', 'blogs.', '/blog/', '/forum/', '/article/', '/tutorial/'
]

# Known non-English / foreign job site TLD patterns
FOREIGN_TLDS = [
    '.de/', '.fr/', '.jp/', '.cn/', '.ru/', '.es/', '.pt/', '.it/',
    '.pl/', '.nl/', '.tr/', '.kr/', '.ar/', '.mx/', '.br/', '.id/',
    '.vn/', '.th/', '.ae/', '.sa/', '.eg/', '.pk/', '.bd/',
    '.de ', '.fr ', '.jp ', '.cn ', '.ru ',
]

EXCLUDE_KEYWORDS = [
    'tutorial', 'course', 'training', 'learn', 'video', 'playlist',
    'roadmap', 'syllabus', 'news', 'blog post', 'podcast', 'forum',
    'discussion', 'how to become', 'step by step', 'cheat sheet'
]

# Unicode ranges for non-Latin scripts — if title contains these, skip
NON_LATIN_RANGES = [
    (0x0600, 0x06FF),  # Arabic
    (0x0900, 0x097F),  # Devanagari (Hindi)
    (0x4E00, 0x9FFF),  # Chinese
    (0x3040, 0x30FF),  # Japanese (hiragana/katakana)
    (0xAC00, 0xD7AF),  # Korean
    (0x0400, 0x04FF),  # Cyrillic (Russian)
    (0x0500, 0x052F),  # Cyrillic supplement
    (0x0E00, 0x0E7F),  # Thai
    (0x0370, 0x03FF),  # Greek
]

def has_non_latin_script(text: str) -> bool:
    """Returns True if text contains characters from non-Latin scripts."""
    for char in text:
        codepoint = ord(char)
        for start, end in NON_LATIN_RANGES:
            if start <= codepoint <= end:
                return True
    return False

def is_english(text: str) -> bool:
    """Check if text is predominantly English (not a foreign script)."""
    if not text or len(text.strip()) < 3:
        return True  # allow short strings
    # Block if non-Latin scripts detected
    if has_non_latin_script(text):
        return False
    # Allow most English text — only block if < 70% ASCII (accommodates special chars, em-dashes etc.)
    ascii_chars = len(text.encode('ascii', 'ignore'))
    if (ascii_chars / len(text)) < 0.70:
        return False
    return True

# --- MODULE LEVEL FETCHERS ---

async def fetch_n8n_jobs(role: str, location: str) -> List[Dict[str, Any]]:
    try:
        url = "http://localhost:5678/webhook/job-search"
        payload = {"role": role, "location": location}
        res = await asyncio.to_thread(requests.post, url, json=payload, timeout=8)
        if res.status_code == 200:
            data = res.json()
            if isinstance(data, list): return data
            return data.get('jobs', [])
    except Exception as e:
        logger.warning(f"n8n search failed: {e}")
    return []

async def fetch_arbeitnow(role: str) -> List[Dict[str, Any]]:
    try:
        # Use search parameter to limit results to the role
        q = role.replace(' ', '+')
        res = await asyncio.to_thread(requests.get, f'https://www.arbeitnow.com/api/job-board-api?search={q}', timeout=8)
        if res.status_code == 200:
            data = res.json().get('data', [])
            # Return only top 5 from Arbeitnow to avoid flooding
            return [{
                "title": j.get('title', ''),
                "company": j.get('company_name', ''),
                "location": j.get('location', '') + (" (Remote)" if j.get('remote') else ""),
                "description": re.sub('<[^<]+?>', '', j.get('description', '')).strip(),
                "apply_link": j.get('url', ''),
                "source": "Arbeitnow"
            } for j in data[:5]]
    except Exception as e:
        logger.warning(f"Arbeitnow failed: {e}")
    return []

async def fetch_remotive(role: str) -> List[Dict[str, Any]]:
    try:
        q = role.replace(' ', '%20')
        res = await asyncio.to_thread(requests.get, f'https://remotive.com/api/remote-jobs?search={q}&limit=20', timeout=8)
        if res.status_code == 200:
            data = res.json().get('jobs', [])
            return [{
                "title": j.get('title', ''),
                "company": j.get('company_name', ''),
                "location": j.get('candidate_required_location', 'Remote'),
                "description": re.sub('<[^<]+?>', '', j.get('description', '')).strip(),
                "apply_link": j.get('url', ''),
                "source": "Remotive"
            } for j in data]
    except Exception as e:
        logger.warning(f"Remotive failed: {e}")
    return []

async def fetch_jobspy_jobs(role: str, location: str) -> List[Dict[str, Any]]:
    try:
        from jobspy import scrape_jobs
        
        def run_spy():
            try:
                search_loc = location if location else "India"
                # Use only the most reliable sites if others fail
                # Sites requested: LinkedIn, Indeed, Glassdoor, Google
                # Valid names are usually lowercase: linkedin, indeed, glassdoor, google
                return scrape_jobs(
                    site_name=["linkedin", "indeed"],
                    search_term=role,
                    location=search_loc,
                    results_wanted=50,
                    country_indeed='india' if any(w in search_loc.lower() for w in ['india', 'hyderabad', 'bangalore']) else 'usa'
                )
            except Exception as inner_e:
                logger.error(f"JobSpy internal error: {inner_e}")
                return None
        
        jobs_df = await asyncio.to_thread(run_spy)
        if jobs_df is None or jobs_df.empty:
            return []
            
        results = []
        for _, row in jobs_df.iterrows():
            site = str(row.get('site', 'web')).lower()
            # Clean up source labels
            source_label = "LinkedIn" if "linkedin" in site else "Indeed" if "indeed" in site else f"JobSource ({site})"
            results.append({
                "title": str(row.get('title', 'Unknown Title')),
                "company": str(row.get('company', 'Unknown Company')),
                "location": str(row.get('location', 'India')),
                "description": str(row.get('description', ''))[:1000],
                "apply_link": str(row.get('job_url', '')),
                "source": source_label
            })
        logger.info(f"JobSpy found {len(results)} jobs targets")
        return results
    except Exception as e:
        logger.warning(f"JobSpy fetch failed: {e}")
    return []

async def fetch_mnc_career_pages(role: str, location: str) -> List[Dict[str, Any]]:
    try:
        search_loc = location if location else "India"
        query = f"{role} careers jobs site:infosys.com OR site:tcs.com OR site:wipro.com OR site:hcltech.com OR site:accenture.com"
        def run_search():
            with DDGS() as ddgs:  # Uses the correctly imported DDGS from top of file
                try:
                    return list(ddgs.text(query, max_results=20))
                except: return []
        results = await asyncio.to_thread(run_search)
        return [{
            "title": r['title'],
            "company": "MNC Careers",
            "location": search_loc,
            "description": r['body'],
            "apply_link": r['href'],
            "source": "Career Portal"
        } for r in results]
    except Exception as e:
        logger.warning(f"MNC search failed: {e}")
    return []

async def fetch_indeed_india(role: str, location: str) -> List[Dict[str, Any]]:
    """Fetch jobs specifically from in.indeed.com using targeted search queries.
    Since Indeed uses JS rendering, we use DuckDuckGo to index their pages."""
    try:
        from duckduckgo_search import DDGS
        search_loc = location if location else "India"
        
        queries = [
            f'{role} jobs in {search_loc} site:in.indeed.com',
            f'{role} hiring {search_loc} indeed.com/jobs',
            f'"{role}" job openings in {search_loc} -site:en.indeed.com site:in.indeed.com',
            f'indeed {role} {search_loc} apply now',
        ]
        
        all_results = []
        
        def run_search(q: str):
            with DDGS() as ddgs:
                try:
                    return list(ddgs.text(q, max_results=15))
                except:
                    return []
        
        for q in queries:
            results = await asyncio.to_thread(run_search, q)
            for r in results:
                href = r['href'].lower()
                # Only include results from in.indeed.com / indeed.com
                if 'indeed.com' not in href:
                    continue
                all_results.append({
                    "title": r['title'],
                    "company": "Indeed Listing",
                    "location": search_loc,
                    "description": r['body'],
                    "apply_link": r['href'],
                    "source": "Indeed"
                })
        
        logger.info(f"Indeed India found {len(all_results)} job links")
        return all_results
    except Exception as e:
        logger.warning(f"Indeed India search failed: {e}")
    return []

async def fetch_naukri_direct(role: str, location: str) -> List[Dict[str, Any]]:
    try:
        search_loc = location if location else "India"
        query = f'site:naukri.com "{role}" jobs in {search_loc}'
        def run_search():
            with DDGS() as ddgs:
                try: return list(ddgs.text(query, max_results=15))
                except: return []
        results = await asyncio.to_thread(run_search)
        return [{
            "title": r['title'],
            "company": "Naukri Listing",
            "location": search_loc,
            "description": r['body'],
            "apply_link": r['href'],
            "source": "Naukri"
        } for r in results]
    except Exception as e:
        logger.warning(f"Naukri direct search failed: {e}")
    return []

async def fetch_adzuna(role: str, settings: Any) -> List[Dict[str, Any]]:
    if not settings.ADZUNA_APP_ID or not settings.ADZUNA_APP_KEY:
        return []
    try:
        url = "https://api.adzuna.com/v1/api/jobs/in/search/1"
        params = {"app_id": settings.ADZUNA_APP_ID, "app_key": settings.ADZUNA_APP_KEY, "what": role, "results_per_page": 20}
        res = await asyncio.to_thread(requests.get, url, params=params, timeout=8)
        if res.status_code == 200:
            data = res.json().get('results', [])
            return [{
                "title": j.get('title', ''),
                "company": j.get('company', {}).get('display_name', ''),
                "location": j.get('location', {}).get('display_name', ''),
                "description": re.sub('<[^<]+?>', '', j.get('description', '')).strip(),
                "apply_link": j.get('redirect_url', ''),
                "source": "Adzuna"
            } for j in data]
    except Exception as e:
        logger.warning(f"Adzuna failed: {e}")
    return []

async def fetch_web_search_jobs(role: str, location: str) -> List[Dict[str, Any]]:
    try:
        search_loc = location if location else "India"
        # Relaxed queries without exact-match quotes to allow for browser-style flexibility
        queries = [
            f'{role} job openings site:linkedin.com in {search_loc}',
            f'{role} hiring site:naukri.com in {search_loc}',
            f'{role} vacancies site:indeed.com in {search_loc}',
            f'{role} recruiter careers portal in {search_loc}',
            f'{role} hiring official link in {search_loc}',
            f'{role} careers site:lever.co OR site:greenhouse.io',
            f'apply for {role} in {search_loc}',
            f'latest job openings for {role}'
        ]
        
        all_results = []
        def run_search(q):
            with DDGS() as ddgs:
                try:
                    # Request significantly more results for deep search
                    return list(ddgs.text(q, max_results=25))
                except: return []
        
        for q in queries:
            results = await asyncio.to_thread(run_search, q)
            # Add site info to source if possible
            for r in results:
                href = r['href'].lower()
                source = "Web Search"
                if "naukri.com" in href: source = "Naukri"
                elif "linkedin.com" in href: source = "LinkedIn"
                elif "indeed.com" in href: source = "Indeed"
                elif "foundit.in" in href or "monsterindia.com" in href: source = "Foundit/Monster"
                elif "hirist.com" in href: source = "Hirist"
                elif "wellfound.com" in href or "angel.co" in href: source = "Wellfound"
                
                all_results.append({
                    "title": r['title'],
                    "company": "External Listing",
                    "location": search_loc,
                    "description": r['body'],
                    "apply_link": r['href'],
                    "source": source
                })
        
        logger.info(f"Web Search found {len(all_results)} jobs targets")
        return all_results
    except Exception as e:
        logger.warning(f"Web search failed: {e}")
    return []

# --- MAIN AGENT CLASSES ---

class JobFinderAgent:
    """Agent responsible for finding job listings from various sources."""
    
    def __init__(self):
        self.llm = get_llm_provider()
        self.settings = get_settings()

    async def search_jobs(self, role: str, location: str = "") -> List[Dict[str, str]]:
        """Search for real job opportunities with maximum reliability and source diversity."""
        all_raw_jobs = []
        final_jobs = []
        
        # 0. Query Relaxation (Broaden role if too specific)
        search_role = role
        if "associative" in role.lower():
            search_role = role.replace("associative", "associate")
            logger.info(f"Relaxed role from '{role}' to '{search_role}'")

        try:
            # 1. Concurrent Collection
            tasks = [
                fetch_web_search_jobs(search_role, location),
                fetch_jobspy_jobs(search_role, location),
                fetch_indeed_india(search_role, location),  # Dedicated Indeed India
                fetch_naukri_direct(search_role, location),
                fetch_mnc_career_pages(search_role, location),
                fetch_arbeitnow(search_role),
                fetch_remotive(search_role),
                fetch_adzuna(search_role, self.settings),
                fetch_n8n_jobs(search_role, location)
            ]
            
            results = await asyncio.gather(*tasks, return_exceptions=True)
            
            # 2. Heuristic Filtering & Metadata Cleanup
            seen_links = set()
            for idx, res_list in enumerate(results):
                source_name = ["Web", "JobSpy", "Indeed", "Naukri", "MNC", "Arbeitnow", "Remotive", "Adzuna", "n8n"][idx]
                
                if not isinstance(res_list, list):
                    logger.error(f"Source {source_name} FAILED: {res_list}")
                    continue
                
                logger.info(f"Source {source_name} returned {len(res_list)} potential jobs.")
                
                for j in res_list:
                    link = j.get('apply_link', '') or ''
                    raw_title = j.get('title', '') or ''
                    raw_company = j.get('company', '') or ''
                    raw_desc = j.get('description', '') or ''
                    
                    link_lower = link.lower()
                    title_lower = raw_title.lower()
                    
                    # A. Deduplication (Normalized URL)
                    norm_link = link_lower.split('?')[0].rstrip('/')
                    if not norm_link or norm_link in seen_links: continue
                    
                    # B. Domain Blacklist (only true spam sites)
                    if any(domain in link_lower for domain in EXCLUDE_DOMAINS): continue
                    
                    # C. Keyword Blacklist (Spam/Non-job content in title only)
                    if any(kw in title_lower for kw in EXCLUDE_KEYWORDS): continue
                    
                    # D. Language Detection — block non-Latin scripts in title only
                    if has_non_latin_script(raw_title): continue
                    if raw_company and has_non_latin_script(raw_company): continue
                    if not is_english(raw_title): continue

                    j.setdefault('company', 'Unknown Company')
                    j.setdefault('location', location or 'India')
                    j['description'] = raw_desc[:1000]
                    
                    all_raw_jobs.append(j)
                    seen_links.add(norm_link)
            
            if not all_raw_jobs:
                logger.info("No valid jobs found after strict filtering.")
                return []

            # 3. Source Diversification for AI Ranking
            logger.info(f"Filtered down to {len(all_raw_jobs)} unique jobs.")
            
            diversified = []
            source_groups = {}
            for j in all_raw_jobs:
                s = j.get('source', 'Web Search')
                if s not in source_groups: source_groups[s] = []
                source_groups[s].append(j)
            
            # Round-robin selection for initial pool
            any_added = True
            idx = 0
            while len(diversified) < 100 and any_added:
                any_added = False
                for s in source_groups:
                    if idx < len(source_groups[s]):
                        diversified.append(source_groups[s][idx])
                        any_added = True
                idx += 1
            
            if not diversified:
                logger.info("No candidates after diversification.")
                return []

            # 5. AI Verification & Ranking
            # Limit to 50 for the prompt to save tokens while keeping volume high
            prompt_candidates = []
            for idx, c in enumerate(diversified[:50]):
                prompt_candidates.append({
                    "id": idx, 
                    "title": c['title'], 
                    "company": c['company'], 
                    "source": c['source'], 
                    "desc": c['description'][:200]
                })

            prompt = f"""
            Select the top 40 most relevant and valid job opportunities for: "{role}".
            
            PRIORITY ORDER:
            1. Direct application links from LinkedIn, Indeed, and Naukri.
            2. Direct Company Career Portals (TCS, Infosys, etc).
            
            Rules:
            - Return up to 40 relevant IDs.
            - Ensure the job title and location match: {role} in {location}.
            - Exclude obvious non-job spam.
            
            Data: {json.dumps(prompt_candidates)}
            
            Return ONLY a JSON array of the most relevant IDs.
            """
            
            try:
                ai_response = await self.llm.generate([{"role": "user", "content": prompt}])
                cleaned = ai_response.strip()
                match = re.search(r'\[.*\]', cleaned, re.DOTALL)
                if match:
                    cleaned = match.group(0)
                
                relevant_ids = json.loads(cleaned)
                for r_id in relevant_ids:
                    if isinstance(r_id, int) and 0 <= r_id < len(diversified):
                        c = diversified[r_id]
                        final_jobs.append({
                            "title": c["title"], "company": c["company"], "location": c["location"][:60],
                            "description": c["description"][:400] + "...", 
                            "link": c["apply_link"], 
                            "source": c["source"]
                        })
            except Exception as e:
                logger.error(f"AI ranking failed or returned invalid format: {e}")
                # Fallback to balanced selection - increased volume
                for c in diversified[:40]:
                    final_jobs.append({
                        "title": c["title"], "company": c["company"], "location": c["location"][:60],
                        "description": c["description"][:400] + "...", 
                        "link": c["apply_link"], 
                        "source": c["source"]
                    })

        except Exception as e:
            logger.error(f"Search pipeline failed: {e}")
            
        # 6. Fallback Search (If still low on results, try a direct wide-net search)
        if len(final_jobs) < 10:
            logger.info("Entering Fallback Broad Search...")
            with DDGS() as ddgs:
                try:
                    fallback_query = f"{search_role} hiring in {location} apply link"
                    results = list(ddgs.text(fallback_query, max_results=20))
                    for r in results:
                        if not any(f['link'] == r['href'] for f in final_jobs):
                            final_jobs.append({
                                "title": r['title'],
                                "company": "Direct Result",
                                "location": location or "India",
                                "description": r['body'],
                                "link": r['href'],
                                "source": "Web Search (Direct)"
                            })
                except Exception as fe:
                    logger.warning(f"Fallback search failed: {fe}")

        logger.info(f"Returning {len(final_jobs)} jobs for {role}")
        return final_jobs[:50]

class JobDescriptionExtractor:
    def __init__(self):
        self.scraper = WebScraper()
        self.llm = get_llm_provider()

    async def extract(self, url: str) -> Dict[str, Any]:
        scrape_result = await self.scraper.scrape_job_link(url)
        if "error" in scrape_result: return scrape_result
        prompt = f"Extract skills, responsibilities, and experience as JSON from: {scrape_result['page_text'][:4000]}"
        analysis = await self.llm.generate([{"role": "user", "content": prompt}])
        try:
            start, end = analysis.find('{'), analysis.rfind('}') + 1
            return {"status": "SUCCESS", "analysis": json.loads(analysis[start:end]), "raw_text": scrape_result['page_text']}
        except:
            return {"status": "SUCCESS", "raw_analysis": analysis, "raw_text": scrape_result['page_text']}

class ResumeParser:
    @staticmethod
    async def parse(file_content: bytes, filename: str) -> str:
        text = ""
        try:
            if filename.lower().endswith('.txt'): return file_content.decode('utf-8', errors='ignore')
            import pypdf
            reader = pypdf.PdfReader(io.BytesIO(file_content))
            for page in reader.pages:
                t = page.extract_text()
                if t: text += t + "\n"
        except Exception as e:
            logger.error(f"Resume parsing failed: {e}")
            raise Exception(f"Failed to parse resume: {e}")
        return text

class ResumeAnalysisAgent:
    def __init__(self):
        self.llm = get_llm_provider()

    async def analyze(self, resume_text: str, jd_analysis: Dict[str, Any]) -> Dict[str, Any]:
        prompt = f"Analyze resume match for JD: {json.dumps(jd_analysis)}. Resume: {resume_text[:3000]}. Format as JSON with match_score and missing_skills."
        response = await self.llm.generate([{"role": "user", "content": prompt}])
        try:
            start, end = response.find('{'), response.rfind('}') + 1
            return json.loads(response[start:end])
        except: return {"raw_response": response}

class ResumeTailorAgent:
    def __init__(self):
        self.llm = get_llm_provider()

    async def tailor(self, resume_text: str, jd_analysis: Dict[str, Any]) -> str:
        prompt = f"Rewrite this resume for these requirements: {json.dumps(jd_analysis)}. Resume: {resume_text[:4000]}. Return ONLY Markdown."
        return await self.llm.generate([{"role": "user", "content": prompt}])

class ResumeGenerator:
    @staticmethod
    def generate_pdf(markdown_text: str, filename_prefix: str = "updated_resume") -> str:
        pdf_dir = os.path.join("app", "static", "resumes")
        os.makedirs(pdf_dir, exist_ok=True)
        pdf_filename = f"{filename_prefix}_{uuid.uuid4().hex[:8]}.pdf"
        pdf_path = os.path.join(pdf_dir, pdf_filename)
        pdf = FPDF()
        pdf.add_page()
        pdf.set_auto_page_break(auto=True, margin=15)
        pdf.set_font('helvetica', size=11)
        for line in markdown_text.split('\n'):
            line = line.encode('latin-1', 'replace').decode('latin-1')
            pdf.multi_cell(0, 6, txt=line)
        pdf.output(pdf_path)
        return f"/static/resumes/{pdf_filename}"

class JobDocsGenerator:
    def __init__(self):
        self.llm = get_llm_provider()

    async def generate_materials(self, resume_text: str, jd_analysis: Dict[str, Any]) -> Dict[str, str]:
        prompt = f"Generate Cover Letter and Interview Questions. Resume: {resume_text[:2000]}. JD: {json.dumps(jd_analysis)}. Format as JSON."
        response = await self.llm.generate([{"role": "user", "content": prompt}])
        try:
            start, end = response.find('{'), response.rfind('}') + 1
            return json.loads(response[start:end])
        except: return {"raw_response": response}

class JobAssistantAgent:
    """Orchestrator for the Job Assistant workflow."""
    def __init__(self):
        self.finder = JobFinderAgent()
        self.extractor = JobDescriptionExtractor()
        self.parser = ResumeParser()
        self.analyzer = ResumeAnalysisAgent()
        self.tailor = ResumeTailorAgent()
        self.generator = ResumeGenerator()
        self.docs_generator = JobDocsGenerator()
