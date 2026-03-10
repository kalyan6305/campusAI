from fastapi import APIRouter, HTTPException, Depends
from app.services.student_service import get_student_by_roll
from typing import Dict, Any

router = APIRouter(prefix="/student", tags=["Student Info"])

@router.get("/{roll_number}")
async def get_student(roll_number: str):
    """
    Fetch student details by roll number from Excel dataset.
    """
    student = get_student_by_roll(roll_number)
    
    if student is None:
        raise HTTPException(status_code=404, detail="Student not found")
        
    return student
