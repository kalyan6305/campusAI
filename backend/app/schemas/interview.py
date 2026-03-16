from pydantic import BaseModel
from typing import List, Optional

class InterviewQuestion(BaseModel):
    id: int
    question: str
    suggested_answer: str

class InterviewRoleRequest(BaseModel):
    role: str
    interview_type: str  # Technical, HR, Mixed, Aptitude Test
    exclude_questions: Optional[List[str]] = []

class InterviewQuestionsResponse(BaseModel):
    role: str
    interview_type: str
    questions: List[InterviewQuestion]

class InterviewFeedbackRequest(BaseModel):
    role: str
    question: str
    user_answer: str

class InterviewFeedbackResponse(BaseModel):
    clarity_score: int  # 0-100
    feedback: str
    missing_points: List[str]
    suggestions: List[str]

class LearningSuggestionsResponse(BaseModel):
    topics: List[str]
    resources: Optional[List[str]] = None

class InterviewDoubtRequest(BaseModel):
    role: str
    question: str
    context: Optional[str] = ""
    user_query: str

class InterviewDoubtResponse(BaseModel):
    answer: str
    suggestions: List[str]
