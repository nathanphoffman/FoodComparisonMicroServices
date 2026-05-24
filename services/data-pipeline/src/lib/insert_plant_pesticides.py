import json
import sqlite3
from ..food_types import PlantPesticide


def insert(conn: sqlite3.Connection, plant_pesticides: list[PlantPesticide]) -> None:
    for pp in plant_pesticides:
        conn.execute(
            "INSERT INTO plant_pesticides (id, plant_id, pesticide_id, kg_ha) VALUES (?, ?, ?, ?)",
            (pp["id"], pp["plant_id"], pp["pesticide_id"],
             json.dumps(pp["kg_ha"]) if pp.get("kg_ha") else None),
        )
