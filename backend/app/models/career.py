"""
Career model.
"""

from __future__ import annotations

from datetime import datetime, timezone

from sqlalchemy import DateTime, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class StudentCareerProfile(Base):
    __tablename__ = "student_career_profiles"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), nullable=False, unique=True
    )
    
    degree_program: Mapped[str | None] = mapped_column(String(255), nullable=True)
    current_year: Mapped[str | None] = mapped_column(String(50), nullable=True)
    interests: Mapped[str | None] = mapped_column(String(500), nullable=True)
    skills: Mapped[str | None] = mapped_column(String(500), nullable=True)
    career_goals: Mapped[str | None] = mapped_column(String(500), nullable=True)
    preferred_path: Mapped[str | None] = mapped_column(String(255), nullable=True)
    
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
    )

    # Relationships
    user = relationship("User", backref="career_profile")

    def __repr__(self) -> str:
        return f"<StudentCareerProfile id={self.id} user_id={self.user_id}>"
