"""
insert_animal_feed.py — inserts animal feed association records.

Animal feed records are Tier 4 and depend on both animals and plants being inserted first.
"""

import json
import sqlite3

from ..food_types import AnimalFeed


def insert(connection: sqlite3.Connection, feed_entries: list[AnimalFeed]) -> None:
    """Inserts all animal feed association records into the animal_feed table."""
    for feed_entry in feed_entries:
        connection.execute(
            "INSERT INTO animal_feed (id, animal_id, plant_id, kg_feed_per_kg_output) VALUES (?, ?, ?, ?)",
            (
                feed_entry["id"],
                feed_entry["animal_id"],
                feed_entry["plant_id"],
                json.dumps(feed_entry["kg_feed_per_kg_output"]),
            ),
        )
