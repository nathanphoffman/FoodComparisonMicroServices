"""
sources.py — reads the citation list from sources.json and works out where each
source's downloaded text is saved. No network access happens here.
"""

import json
import re
from dataclasses import dataclass, field
from pathlib import Path
from typing import Optional

from .paths import OUTPUT_DIR, SOURCES_JSON

# Matches any character that isn't allowed in a filename on Windows or macOS/Linux:
# / \ : * ? " < > |. They are stripped from titles before using them as filenames.
FORBIDDEN_CHARS = r'[/\\:*?"<>|]'


@dataclass
class Source:
    id: int
    url: str
    title: str
    notes: list[str] = field(default_factory=list)
    _status: Optional[str] = None


def load_sources() -> list[Source]:
    """Reads every source listed in sources.json."""
    raw: list[dict] = json.loads(SOURCES_JSON.read_text(encoding="utf-8"))
    return [
        Source(
            id=s["id"],
            url=s["url"],
            title=s["title"],
            notes=s.get("notes") or [],
            _status=s.get("_status"),
        )
        for s in raw
    ]


def sanitize_title(title: str) -> str:
    cleaned = re.sub(FORBIDDEN_CHARS, "", title)
    return re.sub(r"\s+", " ", cleaned).strip()


def output_path(source: Source) -> Path:
    return OUTPUT_DIR / f"{source.id} - {sanitize_title(source.title)}.txt"
