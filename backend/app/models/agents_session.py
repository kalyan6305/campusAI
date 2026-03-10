"""
AgentsSession ORM model.
"""

from __future__ import annotations

from datetime import datetime, timezone

from sqlalchemy import DateTime, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class AgentsSession(Base):
    __tablename__ = "agents_sessions"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        index=True,
        nullable=False,
    )
    title: Mapped[str] = mapped_column(
        String(255), default="New Agent Session", nullable=False
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
    )

    # Relationships
    user = relationship("User")
    messages = relationship(
        "AgentsMessage", back_populates="session", cascade="all, delete-orphan",
        order_by="AgentsMessage.timestamp",
    )

    def __repr__(self) -> str:
        return f"<AgentsSession id={self.id} title={self.title!r}>"
