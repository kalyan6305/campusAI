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
import time

# --- CACHE SYSTEM ---
class SearchCache:
    def __init__(self, ttl_seconds: int = 600):
        self.cache = {}
        self.ttl = ttl_seconds

    def get(self, key: str) -> List[Dict[str, Any]] | None:
        if key in self.cache:
            data, timestamp = self.cache[key]
            if time.time() - timestamp < self.ttl:
                return data
            del self.cache[key]
        return None

    def set(self, key: str, data: List[Dict[str, Any]]):
        self.cache[key] = (data, time.time())

_job_search_cache = SearchCache()

# --- REVISED FETCHERS ---

async def fetch_adzuna(role: str, settings: Any) -> List[Dict[str, Any]]:
    if not settings.ADZUNA_APP_ID or not settings.ADZUNA_APP_KEY:
        logger.warning("Adzuna credentials missing.")
        return []
    try:
        url = "https://api.adzuna.com/v1/api/jobs/in/search/1"
        params = {
            "app_id": settings.ADZUNA_APP_ID,
            "app_key": settings.ADZUNA_APP_KEY,
            "what": role,
            "results_per_page": 10
        }
        res = await asyncio.to_thread(requests.get, url, params=params, timeout=8)
        if res.status_code == 200:
            data = res.json().get('results', [])
            return [{
                "title": j.get('title', ''),
                "company": j.get('company', {}).get('display_name', '') if isinstance(j.get('company'), dict) else str(j.get('company', '')),
                "location": j.get('location', {}).get('display_name', '') if isinstance(j.get('location'), dict) else str(j.get('location', '')),
                "description": re.sub('<[^<]+?>', '', j.get('description', '')).strip(),
                "apply_link": j.get('redirect_url', ''),
                "source": "adzuna"
            } for j in data]
    except Exception as e:
        logger.warning(f"Adzuna failed: {e}")
    return []

async def fetch_jobspy_jobs(role: str, location: str = "India") -> List[Dict[str, Any]]:
    try:
        from jobspy import scrape_jobs
        
        def run_spy():
            try:
                search_loc = location if location else "India"
                return scrape_jobs(
                    site_name=["linkedin", "indeed"],
                    search_term=role,
                    location=search_loc,
                    results_wanted=10,
                    country_indeed='india' if 'india' in search_loc.lower() else 'usa'
                )
            except Exception as inner_e:
                logger.error(f"JobSpy internal error: {inner_e}")
                return None
        
        jobs_df = await asyncio.to_thread(run_spy)
        if jobs_df is None or jobs_df.empty:
            return []
            
        results = []
        for _, row in jobs_df.iterrows():
            results.append({
                "title": str(row.get('title', '')),
                "company": str(row.get('company', '')),
                "location": str(row.get('location', '')),
                "description": str(row.get('description', '')),
                "apply_link": str(row.get('job_url', '')),
                "source": "jobspy"
            })
        return results
    except Exception as e:
        logger.warning(f"JobSpy fetch failed: {e}")
    return []

async def fetch_web_search_jobs(role: str, location: str) -> List[Dict[str, Any]]:
    try:
        search_loc = location if location else "India"
        query = f'{role} job openings in {search_loc} apply link'
        
        def run_search():
            with DDGS() as ddgs:
                try:
                    return list(ddgs.text(query, max_results=10))
                except: return []
        
        results = await asyncio.to_thread(run_search)
        return [{
            "title": r.get('title', 'Unknown'),
            "company": "External",
            "location": search_loc,
            "description": r.get('body', ''),
            "apply_link": r.get('href', ''),
            "source": "web"
        } for r in results]
    except Exception as e:
        logger.warning(f"Web search failed: {e}")
    return []

# --- MAIN AGENT CLASSES ---

class JobFinderAgent:
    """Agent responsible for finding and analyzing job listings."""
    
    def __init__(self):
        self.llm = get_llm_provider()
        self.settings = get_settings()

    async def search_jobs(self, role: str, user_profile: Dict[str, Any], location: str = "") -> List[Dict[str, Any]]:
        """Search for jobs with caching, sequential fallback, and AI enrichment."""
        user_level = user_profile.get('level', 'fresher')
        cache_key = f"{role}_{user_level}".lower().replace(" ", "_")
        
        # 1. Check Cache
        cached_results = _job_search_cache.get(cache_key)
        if cached_results:
            logger.info(f"Returning cached results for {cache_key}")
            return cached_results

        # 2. Sequential Fallback Chain
        jobs = await fetch_adzuna(role, self.settings)
        if not jobs:
            logger.info("Adzuna empty, trying JobSpy...")
            jobs = await fetch_jobspy_jobs(role, location)
        
        if not jobs:
            logger.info("JobSpy empty, trying Web Search...")
            jobs = await fetch_web_search_jobs(role, location)

        if not jobs:
            return []

        # 3. AI Analysis & Enrichment (Batch)
        candidates = jobs[:8]
        analysis_data = []
        for idx, j in enumerate(candidates):
            analysis_data.append({
                "index": idx,
                "title": j.get('title', 'Unknown'),
                "company": j.get('company', 'Unknown'),
                "description": (j.get('description') or '')[:200]
            })

        prompt = f"""
        Analyze these job listings for a candidate with this profile: {json.dumps(user_profile)}.
        Role: {role}
        
        Jobs: {json.dumps(analysis_data)}
        
        For each job index, provide:
        - ai_summary (one concise sentence)
        - match_score (0-100 based on skills/level)
        - tips (one specific advice for applying)
        
        Return ONLY a JSON array indexed by position: [{{"index": 0, "ai_summary": "...", "match_score": 85, "tips": "..."}}, ...]
        No other text.
        """
        
        enriched_jobs = []
        try:
            ai_res = await self.llm.generate([{"role": "user", "content": prompt}])
            if not ai_res:
                raise ValueError("AI returned empty response")
            
            # Simple extractor for json in case of markdown wrapping
            start = ai_res.find('[')
            end = ai_res.rfind(']') + 1
            if start != -1 and end != -1:
                json_str = ai_res[start:end]
                try:
                    ai_analysis = json.loads(json_str)
                except json.JSONDecodeError:
                    logger.error(f"Failed to decode AI JSON: {json_str}")
                    raise
                
                analysis_map = {item['index']: item for item in ai_analysis if isinstance(item, dict) and 'index' in item}
                
                for idx, j in enumerate(candidates):
                    analysis = analysis_map.get(idx, {})
                    enriched_jobs.append({
                        "index": idx,
                        **j,
                        "ai_summary": analysis.get('ai_summary', "No summary available."),
                        "match_score": analysis.get('match_score', 50),
                        "tips": analysis.get('tips', "Follow standard application procedure.")
                    })
            else:
                logger.error(f"AI returned invalid format: {ai_res}")
                raise ValueError("No JSON block found")

        except Exception as e:
            import traceback
            logger.error(f"AI Enrichment failed: {e}\n{traceback.format_exc()}")
            # Fallback without AI enrichment
            for j in candidates:
                enriched_jobs.append({
                    **j,
                    "ai_summary": "AI analysis unavailable.",
                    "match_score": 0,
                    "tips": "Check job description for details."
                })

        # 4. Save to Cache
        _job_search_cache.set(cache_key, enriched_jobs)
        return enriched_jobs

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
