from pydantic import BaseModel
from typing import List, Optional

class InterviewQuestion(BaseModel):
    id: str
    topic: str
    question: str
    difficulty: str
    suggested_answer: str
    expected_signals: List[str]
    follow_up_probes: List[str]
    company_tip: str

class InterviewRoleRequest(BaseModel):
    role: str
    company: Optional[str] = "Generic"
    interview_type: str
    round_type: Optional[str] = None
    difficulty: Optional[str] = "Intermediate"
    exclude_questions: Optional[List[str]] = []
    user_type: Optional[str] = "general"
    experience_years: Optional[int] = 0
    num_questions: Optional[int] = 5
    selected_topic: Optional[str] = None

class InterviewQuestionsResponse(BaseModel):
    role: str
    company: str
    interview_type: str
    round_type: Optional[str] = None
    questions: List[InterviewQuestion]

class InterviewFeedbackRequest(BaseModel):
    role: str
    company: str
    question: str
    user_answer: str
    round_type: Optional[str] = None
    expected_signals: Optional[List[str]] = None
    follow_up_probes: Optional[List[str]] = None
    hint_used: Optional[bool] = False

class InterviewFeedbackResponse(BaseModel):
    clarity_score: int
    what_was_good: str
    missing_points: List[str]
    suggestions: List[str]
    scores: Optional[dict] = None # Detailed dimension scores
    follow_up_question: Optional[str] = None
    interviewer_reaction: Optional[str] = None

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

class FinalInterviewReportRequest(BaseModel):
    role: str
    company: str
    round_results: List[dict]
    overall_dimension_avgs: dict

class FinalInterviewReportResponse(BaseModel):
    overall_score: int
    round_scores: dict
    strengths: List[str]
    weaknesses: List[str]
    selection_probability: str
    learning_plan: List[str]
    next_focus: str

class InterviewTopicsRequest(BaseModel):
    company: str
    round_type: str
    role: str

class InterviewTopicsResponse(BaseModel):
    topics: List[str]

class InterviewMCQItem(BaseModel):
    id: str
    question: str
    topic: str
    difficulty: str
    options: dict
    correct_option: str
    explanation: str
    shortcut_trick: Optional[str] = None

class InterviewMCQRequest(BaseModel):
    company: str
    round_type: str
    role: str
    topic: Optional[str] = None
    n: Optional[int] = 5
    previous_questions: Optional[List[str]] = []

class InterviewTeachRequest(BaseModel):
    company: str
    role: str
    round_type: str
    topic: str

class InterviewTeachResponse(BaseModel):
    topic: str
    what_it_is: str
    why_it_matters_at_company: str
    core_concepts: List[dict]
    patterns_and_tricks: List[str]
    common_mistakes: List[str]
    sample_question: str
    one_liner_to_remember: str

class InterviewProcessRequest(BaseModel):
    company: str
    role: str

class InterviewProcessResponse(BaseModel):
    company: str
    role: str
    rounds: List[str]
    justification: Optional[str] = None
