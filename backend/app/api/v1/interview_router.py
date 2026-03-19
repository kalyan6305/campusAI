import logging
from typing import List
from fastapi import APIRouter, Depends, HTTPException
from app.utils.dependencies import get_current_user
from app.models.user import User
from app.agents.interview_agent import InterviewPreparationAgent
from app.schemas.interview import (
    InterviewRoleRequest, 
    InterviewQuestionsResponse, 
    InterviewFeedbackRequest, 
    InterviewFeedbackResponse,
    LearningSuggestionsResponse,
    InterviewDoubtRequest,
    InterviewDoubtResponse,
    FinalInterviewReportRequest,
    FinalInterviewReportResponse
)

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/interview", tags=["Interview Agent"])

@router.post("/generate", response_model=InterviewQuestionsResponse)
async def generate_interview_questions(
    request: InterviewRoleRequest,
    current_user: User = Depends(get_current_user)
):
    """Generate interview questions based on role and type."""
    try:
        agent = InterviewPreparationAgent()
        questions = await agent.generate_questions(
            request.role, 
            request.interview_type,
            company=request.company,
            round_type=request.round_type,
            difficulty=request.difficulty,
            exclude_questions=request.exclude_questions,
            user_type=request.user_type,
            experience_years=request.experience_years,
            num_questions=request.num_questions
        )
        if not questions:
            raise HTTPException(status_code=500, detail="Failed to generate questions. Please try again.")
            
        return InterviewQuestionsResponse(
            role=request.role,
            company=request.company,
            interview_type=request.interview_type,
            round_type=request.round_type,
            questions=questions
        )
    except Exception as e:
        logger.error(f"Failed to generate questions: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/clarify", response_model=InterviewDoubtResponse)
async def clarify_interview_doubt(
    request: InterviewDoubtRequest,
    current_user: User = Depends(get_current_user)
):
    """Clarify a candidate's doubt."""
    try:
        agent = InterviewPreparationAgent()
        result = await agent.clarify_doubt(
            request.role, 
            request.question, 
            request.context, 
            request.user_query
        )
        return InterviewDoubtResponse(**result)
    except Exception as e:
        logger.error(f"Failed to clarify doubt: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/feedback", response_model=InterviewFeedbackResponse)
async def get_interview_feedback(
    request: InterviewFeedbackRequest,
    current_user: User = Depends(get_current_user)
):
    """Analyze user's answer and return feedback."""
    try:
        agent = InterviewPreparationAgent()
        feedback = await agent.analyze_answer(
            request.role, 
            request.question, 
            request.user_answer,
            expected_signals=request.expected_signals,
            follow_up_probes=request.follow_up_probes,
            hint_used=request.hint_used
        )
        return InterviewFeedbackResponse(**feedback)
    except Exception as e:
        logger.error(f"Failed to analyze answer: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/suggestions", response_model=LearningSuggestionsResponse)
async def get_learning_suggestions(
    questions: List[dict],
    current_user: User = Depends(get_current_user)
):
    """Generate learning suggestions based on questions."""
    try:
        agent = InterviewPreparationAgent()
        topics = await agent.generate_learning_suggestions(questions)
        return LearningSuggestionsResponse(topics=topics)
    except Exception as e:
        logger.error(f"Failed to generate suggestions: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/final-report", response_model=FinalInterviewReportResponse)
async def generate_final_interview_report(
    request: FinalInterviewReportRequest,
    current_user: User = Depends(get_current_user)
):
    """Generate final interview report from all rounds."""
    try:
        agent = InterviewPreparationAgent()
        report = await agent.generate_final_report(
            request.role, 
            request.company, 
            request.round_results,
            request.overall_dimension_avgs
        )
        return FinalInterviewReportResponse(**report)
    except Exception as e:
        logger.error(f"Failed to generate final report: {e}")
        raise HTTPException(status_code=500, detail=str(e))
