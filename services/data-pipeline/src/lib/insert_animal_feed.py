import json
import sqlite3
from ..food_types import AnimalFeed


def insert(conn: sqlite3.Connection, feed_entries: list[AnimalFeed]) -> None:
    for f in feed_entries:
        conn.execute(
            "INSERT INTO animal_feed (id, animal_id, plant_id, kg_feed_per_kg_output) VALUES (?, ?, ?, ?)",
            (f["id"], f["animal_id"], f["plant_id"], json.dumps(f["kg_feed_per_kg_output"])),
        )
