import json
import sqlite3
from ..food_types import PlantAnimalKill


def insert(conn: sqlite3.Connection, kills: list[PlantAnimalKill]) -> None:
    for k in kills:
        conn.execute(
            "INSERT INTO plant_animal_kills (id, plant_id, animal_id, kills_per_ha) VALUES (?, ?, ?, ?)",
            (k["id"], k["plant_id"], k["animal_id"],
             json.dumps(k["kills_per_ha"]) if k.get("kills_per_ha") else None),
        )
