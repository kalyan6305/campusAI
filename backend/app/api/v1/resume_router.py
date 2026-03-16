"""
Resume Agent Router - Endpoints for resume optimization.
"""

from __future__ import annotations
import logging
import json
from fastapi import APIRouter, Depends, UploadFile, File, Form
from fastapi.responses import StreamingResponse
from app.utils.dependencies import get_current_user
from app.models.user import User
from app.agents.resume_agent import ResumeOptimizationAgent

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/resume", tags=["Resume Agent"])

@router.post("/process")
async def process_resume_optimization(
    resume_file: UploadFile = File(...),
    job_description: str = Form(...),
    role: str = Form("Target Role"),
    current_user: User = Depends(get_current_user)
):
    """Streaming endpoint for the full resume optimization pipeline."""
    file_content = await resume_file.read()
    filename = resume_file.filename

    async def event_generator():
        try:
            agent = ResumeOptimizationAgent()
            
            # Step 1: Upload & Parse
            yield f"data: {json.dumps({'status': 'PARSING', 'message': 'Parsing your resume...'})}\n\n"
            resume_text = await agent.parse_resume(file_content, filename)
            
            if not resume_text.strip():
                raise Exception("Could not extract text from document.")

            # Step 2: Analysis
            yield f"data: {json.dumps({'status': 'ANALYZING', 'message': 'Analyzing alignment with job description...'})}\n\n"
            analysis = await agent.analyze_alignment(resume_text, job_description)
            
            # Step 3: Optimization
            yield f"data: {json.dumps({'status': 'OPTIMIZING', 'message': 'Optimizing resume content for ATS...'})}\n\n"
            optimized_md = await agent.optimize_resume(resume_text, job_description, analysis)
            
            # Step 4: PDF Generation
            yield f"data: {json.dumps({'status': 'GENERATING', 'message': 'Generating your optimized PDF...'})}\n\n"
            pdf_url = agent.generate_pdf(optimized_md, role)
            
            # Step 5: Final Results
            report_data = {
                "matched_skills": analysis.get("matched_skills", []),
                "missing_skills": analysis.get("missing_skills", []),
                "keywords": analysis.get("keywords", []),
                "match_score": analysis.get("match_score", 0),
                "pdf_url": pdf_url,
                "optimized_resume_md": optimized_md
            }
            
            yield f"data: {json.dumps({'status': 'COMPLETED', 'data': report_data})}\n\n"
            yield "data: [DONE]\n\n"

        except Exception as e:
            logger.error(f"Resume optimization failed: {e}")
            yield f"data: {json.dumps({'status': 'ERROR', 'message': str(e)})}\n\n"

    return StreamingResponse(event_generator(), media_type="text/event-stream")
