"""
Structured logging configuration.
"""

from __future__ import annotations

import logging
import sys

from pythonjsonlogger import json as json_logger

from app.core.config import get_settings


def setup_logging() -> None:
    """Configure root logger with JSON formatter for production."""
    settings = get_settings()
    level = logging.DEBUG if settings.DEBUG else logging.INFO

    handler = logging.StreamHandler(sys.stdout)
    formatter = json_logger.JsonFormatter(
        fmt="%(asctime)s %(levelname)s %(name)s %(message)s",
        datefmt="%Y-%m-%dT%H:%M:%S",
    )
    handler.setFormatter(formatter)

    root = logging.getLogger()
    root.setLevel(level)
    root.handlers.clear()
    root.addHandler(handler)

    # Silence noisy libraries
    logging.getLogger("sqlalchemy.engine").setLevel(logging.WARNING)
    logging.getLogger("httpx").setLevel(logging.WARNING)
    logging.getLogger("uvicorn.access").setLevel(logging.INFO)
