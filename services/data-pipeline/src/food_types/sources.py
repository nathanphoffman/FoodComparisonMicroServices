"""
sources.py — the sources that back the numbers.

TypedDicts, so they map cleanly to/from JSON without extra parsing.
"""

from typing import TypedDict


class Source(TypedDict):
    id: int
    url: str
    title: str
    notes: list[str] | None
