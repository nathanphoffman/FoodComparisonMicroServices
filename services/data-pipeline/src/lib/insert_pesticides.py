"""
insert_pesticides.py — inserts pesticide records into the pesticides table.

Pesticides are Tier 1 (no foreign keys) and must be inserted before plant_pesticides.
"""

import json
import sqlite3

from ..food_types import Pesticide


def encode_optional_json(sourced_array: list | None) -> str | None:
    """Returns a JSON-encoded sourced array, or None if the array is absent."""
    return json.dumps(sourced_array) if sourced_array else None


def insert(connection: sqlite3.Connection, pesticides: list[Pesticide]) -> None:
    """Inserts all pesticide records into the pesticides table."""
    for pesticide in pesticides:
        connection.execute(
            "INSERT INTO pesticides (id, name, freshwater_paf, terrestrial_paf, insect_paf, bee_ld50) VALUES (?, ?, ?, ?, ?, ?)",
            (
                pesticide["id"],
                pesticide["name"],
                json.dumps(pesticide["freshwater_paf"]),
                encode_optional_json(pesticide.get("terrestrial_paf")),
                encode_optional_json(pesticide.get("insect_paf")),
                encode_optional_json(pesticide.get("bee_ld50")),
            ),
        )
