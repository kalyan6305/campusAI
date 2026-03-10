"""
CampusSession ORM model.
"""

from __future__ import annotations

from datetime import datetime, timezone

from sqlalchemy import DateTime, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class CampusSession(Base):
    __tablename__ = "campus_sessions"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        index=True,
        nullable=False,
    )
    title: Mapped[str] = mapped_column(
        String(255), default="New Campus Session", nullable=False
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
    )

    # Relationships
    user = relationship("User")
    messages = relationship(
        "CampusMessage", back_populates="session", cascade="all, delete-orphan",
        order_by="CampusMessage.timestamp",
    )

    def __repr__(self) -> str:
        return f"<CampusSession id={self.id} title={self.title!r}>"
