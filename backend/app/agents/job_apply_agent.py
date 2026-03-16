"""
Job Apply Agent - Handles resume optimization and job application preparation.
Expanded from the original Resume Agent.
"""

from __future__ import annotations
import logging
import io
import json
import os
import uuid
from typing import Dict, List, Any
from playwright.async_api import async_playwright
from app.llm.factory import get_llm_provider
from app.utils.web_scraper import WebScraper

logger = logging.getLogger(__name__)

class JobApplyAgent:
    def __init__(self):
        self.llm = get_llm_provider()
        self.scraper = WebScraper()

    async def parse_resume(self, file_content: bytes, filename: str = "") -> str:
        """Extract text from PDF or Text resume."""
        text = ""
        try:
            if filename.lower().endswith('.txt'):
                return file_content.decode('utf-8', errors='ignore')

            import pypdf
            reader = pypdf.PdfReader(io.BytesIO(file_content))
            for page in reader.pages:
                page_text = page.extract_text()
                if page_text:
                    text += page_text + "\n"
                    
            if not text.strip():
                import pdfplumber
                with pdfplumber.open(io.BytesIO(file_content)) as pdf:
                    for page in pdf.pages:
                        page_text = page.extract_text()
                        if page_text:
                            text += page_text + "\n"
        except Exception as e:
            logger.error(f"Error parsing resume: {e}")
            raise Exception(f"Failed to parse resume: {e}")
        return text

    async def fill_form_and_screenshot(self, url: str, data: Dict[str, str]) -> Dict[str, Any]:
        """Use Playwright to fill the form on the employer site and take a screenshot."""
        screenshot_dir = os.path.join("app", "static", "screenshots")
        os.makedirs(screenshot_dir, exist_ok=True)
        screenshot_filename = f"apply_{uuid.uuid4().hex}.png"
        screenshot_path = os.path.join(screenshot_dir, screenshot_filename)

        try:
            async with async_playwright() as p:
                browser = await p.chromium.launch(headless=True)
                page = await browser.new_page()
                await page.goto(url, wait_until="networkidle", timeout=60000)

                # Attempt to fill fields
                # We use a fuzzy matching strategy for labels/placeholders
                for field_name, value in data.items():
                    try:
                        # Try finding by placeholder, aria-label, name, or id
                        selectors = [
                            f"input[placeholder*='{field_name}' i]",
                            f"input[name*='{field_name}' i]",
                            f"input[id*='{field_name}' i]",
                            f"textarea[placeholder*='{field_name}' i]",
                            f"label:has-text('{field_name}') + input",
                            f"label:has-text('{field_name}') + textarea"
                        ]
                        for selector in selectors:
                            el = await page.query_selector(selector)
                            if el:
                                await el.fill(str(value))
                                break
                    except Exception as e:
                        logger.warning(f"Could not fill field {field_name}: {e}")

                # Take screenshot as proof
                await page.screenshot(path=screenshot_path)
                await browser.close()

                return {
                    "status": "FILLED",
                    "screenshot_url": f"/static/screenshots/{screenshot_filename}",
                    "message": "Form auto-filled successfully. Screenshot taken."
                }
        except Exception as e:
            logger.error(f"Auto-fill failed: {e}")
            return {"status": "ERROR", "message": str(e)}

    async def analyze_job_link(self, url: str) -> Dict[str, Any]:
        """Scrape and analyze a job application link."""
        scrape_result = await self.scraper.scrape_job_link(url)
        if "error" in scrape_result:
            return scrape_result

        prompt = f"""
        Analyze the following scraped webpage content from a job application link.
        Extract:
        1. Required input fields (name, email, phone, experience, etc.)
        2. Resume upload requirements.
        3. Any additional questions (e.g., salary expectations, relocation).
        
        Webpage Text Context:
        {scrape_result['page_text'][:5000]}
        
        Raw Form Fields Detected:
        {json.dumps(scrape_result['form_fields'])}
        
        Format the output as a JSON object:
        {{
            "required_fields": [{{ "name": "field_name", "type": "text/file/etc", "label": "description" }}],
            "additional_questions": ["question 1", "question 2"],
            "requirements_summary": "brief summary of what's needed"
        }}
        """
        messages = [{"role": "user", "content": prompt}]
        analysis = await self.llm.generate(messages)
        
        try:
            # Attempt to parse JSON from LLM response
            start = analysis.find('{')
            end = analysis.rfind('}') + 1
            structured_data = json.loads(analysis[start:end])
            return {**scrape_result, "analysis": structured_data}
        except:
            return {**scrape_result, "raw_analysis": analysis}

    async def analyze_job_description(self, jd_text: str) -> Dict[str, Any]:
        """Extract requirements from job description."""
        prompt = f"""
        Analyze the following job description and extract:
        - required_skills: list
        - technologies: list
        - responsibilities: list
        - keywords: list
        - experience_level: string

        JD Text:
        {jd_text}
        """
        messages = [{"role": "user", "content": prompt}]
        response = await self.llm.generate(messages)
        return {"raw_analysis": response, "text": jd_text}

    async def prepare_application_data(self, resume_text: str, form_analysis: Dict) -> Dict[str, Any]:
        """Match resume data to required form fields and identify missing info."""
        prompt = f"""
        Given the resume text and the job application form analysis, map the resume content to the required fields.
        Identify which fields are missing or need user input.

        Resume:
        {resume_text[:4000]}

        Form Analysis:
        {json.dumps(form_analysis.get('analysis', form_analysis))}

        Format the output as JSON:
        {{
            "prepared_data": {{ "field_name": "extracted_value" }},
            "missing_fields": ["field_name_1", "field_name_2"],
            "questions_for_user": ["What is your current location?", "What is your expected salary?"]
        }}
        """
        messages = [{"role": "user", "content": prompt}]
        response = await self.llm.generate(messages)
        try:
            start = response.find('{')
            end = response.rfind('}') + 1
            return json.loads(response[start:end])
        except:
            return {"raw_response": response}

    async def optimize_resume(self, resume_text: str, jd_text: str) -> str:
        """Tailor resume to JD."""
        prompt = f"""
        Rewrite this resume to optimize it for the following job description.
        Focus on experience, skills, and summary.
        
        Resume: {resume_text[:2000]}
        JD: {jd_text[:2000]}
        
        Return ONLY the optimized resume text.
        """
        messages = [{"role": "user", "content": prompt}]
        return await self.llm.generate(messages)

    async def generate_readiness_summary(self, match_score: int, missing_skills: List[str], prepared_data: Dict) -> str:
        """Create a final readiness report."""
        prompt = f"""
        Generate a 'Job Application Readiness Summary' based on:
        - Match Score: {match_score}%
        - Missing Skills: {", ".join(missing_skills)}
        - Prepared Data Count: {len(prepared_data)}

        Make it encouraging and highlight what the student still needs to do.
        """
        messages = [{"role": "user", "content": prompt}]
        return await self.llm.generate(messages)
