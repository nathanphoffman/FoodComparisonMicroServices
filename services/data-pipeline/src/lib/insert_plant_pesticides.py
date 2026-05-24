"""
insert_plant_pesticides.py — inserts plant-pesticide association records.

Plant pesticides are Tier 4 and depend on both plants and pesticides being inserted first.
"""

import json
import sqlite3

from ..food_types import PlantPesticide


def insert(connection: sqlite3.Connection, plant_pesticides: list[PlantPesticide]) -> None:
    """Inserts all plant-pesticide association records into the plant_pesticides table."""
    for plant_pesticide in plant_pesticides:
        connection.execute(
            "INSERT INTO plant_pesticides (id, plant_id, pesticide_id, kg_ha) VALUES (?, ?, ?, ?)",
            (
                plant_pesticide["id"],
                plant_pesticide["plant_id"],
                plant_pesticide["pesticide_id"],
                json.dumps(plant_pesticide["kg_ha"]) if plant_pesticide.get("kg_ha") else None,
            ),
        )
