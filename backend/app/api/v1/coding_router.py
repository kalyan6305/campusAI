"""
Coding Agent API Router
"""

from __future__ import annotations

import logging
from fastapi import APIRouter, Depends
from pydantic import BaseModel

from app.models.user import User
from app.utils.dependencies import get_current_user
from app.agents.coding_agent import CodingAgent

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/coding", tags=["Coding Agent"])

class GenerateCodeRequest(BaseModel):
    prompt: str
    language: str

class RunCodeRequest(BaseModel):
    code: str
    language: str

class TransformCodeRequest(BaseModel):
    code: str
    language: str
    action: str # 'debug' or 'optimize'

@router.post("/generate")
async def generate_code(
    request: GenerateCodeRequest,
    current_user: User = Depends(get_current_user)
):
    """Generate raw code based on prompt for the coding workspace editor."""
    agent = CodingAgent()
    try:
        code = await agent.generate_raw_code(request.prompt, request.language)
        return {"code": code}
    except Exception as e:
        logger.error(f"Error generating code: {e}")
        return {"code": f"// Error generating code: {e}"}

@router.post("/run")
async def run_code(
    request: RunCodeRequest,
    current_user: User = Depends(get_current_user)
):
    """Execute code in the coding workspace and return the output."""
    agent = CodingAgent()
    try:
        result = await agent.run_code(request.code, request.language)
        return result
    except Exception as e:
        logger.error(f"Error executing code: {e}")
        return {"stdout": "", "stderr": str(e), "code": -1}

@router.post("/transform")
async def transform_code(
    request: TransformCodeRequest,
    current_user: User = Depends(get_current_user)
):
    """Transform code (debug/optimize) for side-by-side diff view."""
    agent = CodingAgent()
    try:
        modified_code = await agent.transform_code(request.code, request.language, request.action)
        return {"modified_code": modified_code}
    except Exception as e:
        logger.error(f"Error transforming code: {e}")
        return {"modified_code": request.code, "error": str(e)}
