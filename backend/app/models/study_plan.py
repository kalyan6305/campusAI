"""
Study Plan model.
"""

from __future__ import annotations

from datetime import datetime, timezone
import json

from sqlalchemy import DateTime, ForeignKey, String, Text, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class StudentStudyPlan(Base):
    __tablename__ = "student_study_plans"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    session_id: Mapped[str] = mapped_column(String(36), unique=True, nullable=False) # UUID
    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    
    subject: Mapped[str] = mapped_column(String(255), nullable=False)
    level: Mapped[str] = mapped_column(String(50), nullable=False)
    plan_data: Mapped[dict] = mapped_column(JSON, nullable=False) # The full JSON plan
    progress_data: Mapped[dict] = mapped_column(JSON, nullable=True) # Checkbox states: {"topic_id/day": bool}
    
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
    )

    # Relationships
    user = relationship("User", backref="study_plans")

    def __repr__(self) -> str:
        return f"<StudentStudyPlan id={self.id} session_id={self.session_id}>"
