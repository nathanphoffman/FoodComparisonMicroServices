"""
insert_food_sources.py — copies every sourced figure of every food into food_sources.

The typed tables keep only the fields the calculations need; the web app's food detail
modal also shows lifetime output, offspring, availability, feed, ingredient and pesticide
sources. Reading the raw JSON keeps this one flat, display-only table in step with the data.
"""

import json
import sqlite3
from pathlib import Path

from .load_foods import CATEGORY_FILES


def insert(connection: sqlite3.Connection, data_dir: Path) -> None:
    """Inserts one food_sources row per sourced field, feed row, ingredient and pesticide."""
    for category_name in CATEGORY_FILES:
        category_path = data_dir / "foods" / f"{category_name}.json"
        if not category_path.exists():
            continue
        for item in json.loads(category_path.read_text(encoding="utf-8")):
            for field, sources in _sourced_fields(item):
                connection.execute(
                    "INSERT INTO food_sources (food_id, field, sources) VALUES (?, ?, ?)",
                    (item["id"], field, json.dumps(sources)),
                )


def _sourced_fields(item: dict):
    """Yields (field name, sourced array) for each sourced value in one food item."""
    for field, value in item.items():
        if _is_sourced_array(value):
            yield field, value
    for feed in item.get("feed") or []:
        yield f"feed:{feed['food_slug']}", feed["kg_feed_per_kg_output"]
    for pesticide in item.get("pesticides") or []:
        yield f"pesticide:{pesticide['name']}", pesticide["kg_ha"]
    for ingredient in item.get("ingredients") or []:
        yield f"ingredient:{ingredient.get('food_slug') or ingredient.get('label')}", ingredient["fraction"]


def _is_sourced_array(value: object) -> bool:
    return (
        isinstance(value, list) and bool(value)
        and all(isinstance(entry, dict) and "value" in entry and "source" in entry for entry in value)
    )
