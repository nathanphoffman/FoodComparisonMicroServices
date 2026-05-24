import json
import sqlite3
from ..food_types import Source


def insert(conn: sqlite3.Connection, sources: list[Source]) -> None:
    for s in sources:
        conn.execute(
            "INSERT INTO sources (id, url, title, notes) VALUES (?, ?, ?, ?)",
            (s["id"], s["url"], s["title"], json.dumps(s["notes"]) if s.get("notes") else None),
        )
