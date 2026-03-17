"""
Career Assistant API - Handles job discovery, resume tailoring, and material generation.
"""

from __future__ import annotations
import logging
import json
from typing import Optional
from fastapi import APIRouter, Depends, UploadFile, File, Form
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.base import get_db
from app.models.user import User
from app.utils.dependencies import get_current_user
from app.agents.job_assistant_agent import JobAssistantAgent

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/job-apply", tags=["Job Assistant"])

from pydantic import BaseModel
from typing import Dict, Any, List

class JobSearchRequest(BaseModel):
    role: str
    user_profile: Dict[str, Any]
    location: Optional[str] = "remote"

@router.post("/search")
async def search_jobs(
    request: JobSearchRequest,
    current_user: User = Depends(get_current_user)
):
    """Search for jobs related to the selected role."""
    agent = JobAssistantAgent()
    jobs = await agent.finder.search_jobs(
        role=request.role, 
        user_profile=request.user_profile, 
        location=request.location
    )
    if not jobs:
        return {"status": "ERROR", "message": "No jobs found for this role.", "jobs": []}
    return {"status": "SUCCESS", "jobs": jobs}

@router.post("/process")
async def process_job_application(
    resume_file: UploadFile = File(...),
    job_data: str = Form(...), # JSON string containing job link or details
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Multi-step pipeline for job assistance: Extract -> Analyze -> Tailor -> Generate
    """
    file_content = await resume_file.read()
    filename = resume_file.filename

    async def event_generator():
        try:
            yield f"data: {json.dumps({'status': 'INITIALIZING', 'message': 'Starting Job Assistant pipeline...'})}\n\n"
            
            agent = JobAssistantAgent()
            target_job = json.loads(job_data)
            
            # 1. Parsing Resume
            yield f"data: {json.dumps({'status': 'PARSING', 'message': 'Extracting text from resume...'})}\n\n"
            resume_text = await agent.parser.parse(file_content, filename)
            
            if not resume_text.strip():
                raise Exception("Could not extract text from resume.")

            # 2. Extracting Job Description
            jd_analysis = None
            if target_job.get('link'):
                target_company = target_job.get('company', 'employer')
                yield f"data: {json.dumps({'status': 'EXTRACTING_JD', 'message': f'Extracting requirements from {target_company}...'})}\n\n"
                extract_res = await agent.extractor.extract(target_job['link'])
                jd_analysis = extract_res.get('analysis', {"description": extract_res.get('raw_text', '')})
            else:
                jd_analysis = {"description": target_job.get('description', '')}

            # 3. Resume Analysis
            yield f"data: {json.dumps({'status': 'ANALYZING', 'message': 'Analyzing ATS compatibility and skill gaps...'})}\n\n"
            analysis_results = await agent.analyzer.analyze(resume_text, jd_analysis)

            # 4. Tailoring Resume
            yield f"data: {json.dumps({'status': 'TAILORING', 'message': 'Optimizing resume for this role...'})}\n\n"
            optimized_resume_md = await agent.tailor.tailor(resume_text, jd_analysis)

            # 5. Generating Materials (PDF, Cover Letter)
            yield f"data: {json.dumps({'status': 'GENERATING', 'message': 'Generating PDF and application materials...'})}\n\n"
            pdf_url = agent.generator.generate_pdf(
                optimized_resume_md, 
                filename_prefix=f"resume_{target_job.get('company', 'target')}".replace(' ', '_')
            )
            extra_materials = await agent.docs_generator.generate_materials(optimized_resume_md, jd_analysis)

            # 6. Final Report
            yield f"data: {json.dumps({'status': 'REPORTING', 'message': 'Finalizing career package...'})}\n\n"
            
            # Construct a rich response
            report_content = f"""
# 🎯 Application Package for {target_job.get('title', 'Target Role')}

## 📊 Analysis Results
- **Match Score**: {analysis_results.get('match_score', 'N/A')}%
- **ATS Compatibility**: {analysis_results.get('ats_compatibility', '')}
- **Missing Skills to Learn**: {', '.join(analysis_results.get('missing_skills', []))}

## 📄 Download Optimized Resume
[📥 Click here to download PDF]({pdf_url})

## 📝 Cover Letter
{extra_materials.get('cover_letter', 'Not generated.')}

## 🤝 Recruiter Outreach Message
{extra_materials.get('outreach_message', 'Not generated.')}

## 🎙️ Interview Prep Questions
{chr(10).join([f"- {q}" for q in extra_materials.get('interview_questions', [])])}

## 👀 Optimized Resume (Preview)
{optimized_resume_md}
"""
            yield f"data: {json.dumps({'status': 'COMPLETED', 'content': report_content})}\n\n"
            yield "data: [DONE]\n\n"

        except Exception as e:
            logger.error(f"Pipeline failed: {e}")
            yield f"data: {json.dumps({'error': str(e)})}\n\n"

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream"
    )
