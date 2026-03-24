"""
User ORM model.
"""

from __future__ import annotations

from datetime import datetime, timezone

from sqlalchemy import DateTime, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    email: Mapped[str] = mapped_column(
        String(255), unique=True, index=True, nullable=False
    )
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    
    # Personalization Settings
    nickname: Mapped[str | None] = mapped_column(String(100), nullable=True)
    occupation: Mapped[str | None] = mapped_column(String(150), nullable=True)
    about_me: Mapped[str | None] = mapped_column(String(1000), nullable=True)
    custom_instructions: Mapped[str | None] = mapped_column(String(2000), nullable=True)
    
    # UI & Language Preferences
    appearance: Mapped[str] = mapped_column(String(20), default="system")
    accent_color: Mapped[str] = mapped_column(String(30), default="blue")
    language: Mapped[str] = mapped_column(String(20), default="english")

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
    )

    # Relationships
    sessions = relationship(
        "ChatSession", back_populates="user", cascade="all, delete-orphan"
    )
    voice_sessions = relationship(
        "VoiceSession", back_populates="user", cascade="all, delete-orphan"
    )

    def __repr__(self) -> str:
        return f"<User id={self.id} email={self.email}>"
