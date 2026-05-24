"""
insert_plant_kills.py — inserts plant-animal kill records into the plant_animal_kills table.

Plant animal kills are Tier 4 and depend on both plants and animals being inserted first.
"""

import json
import sqlite3

from ..food_types import PlantAnimalKill


def insert(connection: sqlite3.Connection, plant_animal_kills: list[PlantAnimalKill]) -> None:
    """Inserts all plant-animal kill records into the plant_animal_kills table."""
    for plant_kill in plant_animal_kills:
        connection.execute(
            "INSERT INTO plant_animal_kills (id, plant_id, animal_id, kills_per_ha) VALUES (?, ?, ?, ?)",
            (
                plant_kill["id"],
                plant_kill["plant_id"],
                plant_kill["animal_id"],
                json.dumps(plant_kill["kills_per_ha"]) if plant_kill.get("kills_per_ha") else None,
            ),
        )
