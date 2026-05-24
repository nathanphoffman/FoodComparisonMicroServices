"""
insert_sources.py — inserts source citation records into the sources table.

Sources are Tier 1 (no foreign keys) and must be inserted before any other table.
"""

import json
import sqlite3

from ..food_types import Source


def insert(connection: sqlite3.Connection, sources: list[Source]) -> None:
    """Inserts all source records into the sources table."""
    for source in sources:
        connection.execute(
            "INSERT INTO sources (id, url, title, notes) VALUES (?, ?, ?, ?)",
            (
                source["id"],
                source["url"],
                source["title"],
                json.dumps(source["notes"]) if source.get("notes") else None,
            ),
        )
