"""
AgentsMessage ORM model.
"""

from __future__ import annotations

from datetime import datetime, timezone

from sqlalchemy import DateTime, Enum, ForeignKey, Text, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class AgentsMessage(Base):
    __tablename__ = "agents_messages"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    session_id: Mapped[int] = mapped_column(
        ForeignKey("agents_sessions.id", ondelete="CASCADE"),
        index=True,
        nullable=False,
    )
    role: Mapped[str] = mapped_column(
        Enum("user", "assistant", "system", name="agents_message_role"),
        nullable=False,
    )
    content: Mapped[str] = mapped_column(Text, nullable=False)
    timestamp: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
    )
    meta_data: Mapped[dict | None] = mapped_column(JSON, nullable=True)

    # Relationships
    session = relationship("AgentsSession", back_populates="messages")

    def __repr__(self) -> str:
        return f"<AgentsMessage id={self.id} role={self.role}>"
