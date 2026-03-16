"""
Resume Optimization Agent - Specialized components for resume analysis and ATS optimization.
"""

from __future__ import annotations
import logging
import io
import os
import uuid
import json
from typing import List, Dict, Any
from app.llm.factory import get_llm_provider
from app.core.config import get_settings
from fpdf import FPDF
import pypdf
import docx

logger = logging.getLogger(__name__)

class ResumeOptimizationAgent:
    def __init__(self):
        self.llm = get_llm_provider()
        self.settings = get_settings()

    async def parse_resume(self, file_content: bytes, filename: str) -> str:
        """Extract text from PDF or DOCX resume."""
        text = ""
        try:
            if filename.lower().endswith('.pdf'):
                reader = pypdf.PdfReader(io.BytesIO(file_content))
                for page in reader.pages:
                    page_text = page.extract_text()
                    if page_text:
                        text += page_text + "\n"
            elif filename.lower().endswith('.docx'):
                doc = docx.Document(io.BytesIO(file_content))
                text = "\n".join([para.text for para in doc.paragraphs])
            else:
                text = file_content.decode('utf-8', errors='ignore')
        except Exception as e:
            logger.error(f"Error parsing resume: {e}")
            raise Exception(f"Failed to parse resume: {e}")
        return text

    async def analyze_alignment(self, resume_text: str, job_description: str) -> Dict[str, Any]:
        """Analyze how well the resume matches the job description."""
        prompt = f"""
        Compare the following resume against the job description.
        
        Job Description:
        {job_description[:3000]}
        
        Resume:
        {resume_text[:4000]}
        
        Identify:
        1. Matched Skills (present in both)
        2. Missing Skills (required by JD but missing/weak in resume)
        3. Relevant Keywords for ATS optimization
        4. Experience alignment summary
        5. Overall ATS match score (0-100)

        Format your response as a JSON object:
        {{
            "matched_skills": ["skill1", "skill2"],
            "missing_skills": ["skill3", "skill4"],
            "keywords": ["key1", "key2"],
            "alignment_summary": "Summary text...",
            "match_score": 85
        }}
        """
        messages = [{"role": "user", "content": prompt}]
        response = await self.llm.generate(messages)
        try:
            start = response.find('{')
            end = response.rfind('}') + 1
            return json.loads(response[start:end])
        except Exception:
            # Fallback if AI doesn't return clean JSON
            return {"raw_analysis": response, "match_score": 0}

    async def optimize_resume(self, resume_text: str, job_description: str, analysis: Dict[str, Any]) -> str:
        """Generate an optimized version of the resume in Markdown."""
        prompt = f"""
        Rewrite the following resume to optimize it for the specific job description provided.
        Use the analysis results to fill gaps and emphasize matches.
        
        STRICT RULES:
        1. Keep it TRUTHFUL. Do not invent facts, only improve presentation and keyword alignment.
        2. Use action verbs and quantifiable achievements.
        3. Focus on the most relevant experience for this specific role.
        4. Return ONLY the Markdown content of the new resume.
        
        Job Description:
        {job_description[:2000]}
        
        Analysis Results:
        {json.dumps(analysis)}
        
        Current Resume:
        {resume_text[:4000]}
        
        Optimized Markdown Resume:
        """
        messages = [{"role": "user", "content": prompt}]
        return await self.llm.generate(messages)

    def generate_pdf(self, markdown_text: str, role: str) -> str:
        """Convert optimized Markdown resume to PDF and return relative URL."""
        pdf_dir = os.path.join("app", "static", "resumes")
        os.makedirs(pdf_dir, exist_ok=True)
        filename = f"optimized_resume_{role.lower().replace(' ', '_')}_{uuid.uuid4().hex[:6]}.pdf"
        file_path = os.path.join(pdf_dir, filename)

        try:
            pdf = FPDF()
            pdf.add_page()
            pdf.set_auto_page_break(auto=True, margin=15)
            pdf.set_font("helvetica", size=11)
            
            # Simple markdown to text conversion
            clean_text = markdown_text.replace('**', '').replace('### ', '').replace('## ', '').replace('# ', '').replace('* ', '- ')
            
            for line in clean_text.split('\n'):
                # Basic sanitization for fpdf
                safe_line = line.encode('latin-1', 'replace').decode('latin-1')
                if safe_line.strip():
                    pdf.multi_cell(0, 8, txt=safe_line)
                else:
                    pdf.ln(4) # Add small space for empty lines

            pdf.output(file_path)
        except Exception as e:
            logger.error(f"PDF Generation failed: {e}")
            # Create a very simple fallback PDF if it fails
            pdf = FPDF()
            pdf.add_page()
            pdf.set_font("helvetica", size=12)
            pdf.cell(0, 10, txt="Optimized Resume (Error generating full PDF)", ln=True)
            pdf.output(file_path)

        return f"/static/resumes/{filename}"
