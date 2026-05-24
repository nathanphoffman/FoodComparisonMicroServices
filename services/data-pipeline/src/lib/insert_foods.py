import json
import sqlite3
from ..types import Food


def insert(conn: sqlite3.Connection, foods: list[Food]) -> None:
    for f in foods:
        conn.execute(
            "INSERT INTO foods (id, slug, name, type, nutrition, human_food, tags) VALUES (?, ?, ?, ?, ?, ?, ?)",
            (f["id"], f["slug"], f["name"], f["type"],
             json.dumps(f["nutrition"]), f["human_food"], json.dumps(f.get("tags") or [])),
        )
