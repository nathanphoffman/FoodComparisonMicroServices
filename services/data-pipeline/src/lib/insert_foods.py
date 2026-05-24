"""
insert_foods.py — inserts base food records into the foods table.

Foods are Tier 2 and depend on sources being inserted first.
"""

import json
import sqlite3

from ..food_types import Food


def insert(connection: sqlite3.Connection, foods: list[Food]) -> None:
    """Inserts all food records into the foods table."""
    for food in foods:
        connection.execute(
            "INSERT INTO foods (id, slug, name, type, nutrition, human_food, tags) VALUES (?, ?, ?, ?, ?, ?, ?)",
            (
                food["id"],
                food["slug"],
                food["name"],
                food["type"],
                json.dumps(food["nutrition"]),
                food["human_food"],
                json.dumps(food.get("tags") or []),
            ),
        )
