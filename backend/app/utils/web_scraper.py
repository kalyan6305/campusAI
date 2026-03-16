import logging
import asyncio
from typing import Dict, Any, List
from bs4 import BeautifulSoup
from playwright.async_api import async_playwright

logger = logging.getLogger(__name__)

class WebScraper:
    """Utility to scrape and analyze job application webpages."""
    
    async def scrape_job_link(self, url: str) -> Dict[str, Any]:
        """Scrape a job application link and extract key information."""
        try:
            async with async_playwright() as p:
                browser = await p.chromium.launch(headless=True)
                page = await browser.new_page()
                
                # Set a reasonable timeout
                await page.goto(url, wait_until="networkidle", timeout=30000)
                
                # Get the full page content
                content = await page.content()
                
                # Extract input fields
                inputs = await page.query_selector_all("input, textarea, select")
                form_fields = []
                for input_el in inputs:
                    name = await input_el.get_attribute("name") or await input_el.get_attribute("id") or await input_el.get_attribute("placeholder")
                    type_attr = await input_el.get_attribute("type") or "text"
                    if name:
                        form_fields.append({"name": name, "type": type_attr})
                
                # Extract page text for context
                soup = BeautifulSoup(content, 'html.parser')
                # Remove script and style elements
                for script in soup(["script", "style"]):
                    script.extract()
                
                text = soup.get_text(separator=' ', strip=True)
                # Truncate text to avoid overly large prompts
                text = text[:10000] 
                
                await browser.close()
                
                return {
                    "url": url,
                    "page_text": text,
                    "form_fields": form_fields,
                    "html_summary": content[:2000] # For debugging/context
                }
        except Exception as e:
            logger.error(f"Error scraping job link {url}: {e}")
            return {"error": str(e), "url": url}

    def clean_text(self, text: str) -> str:
        """Helper to clean extracted text."""
        import re
        return re.sub(r'\s+', ' ', text).strip()
