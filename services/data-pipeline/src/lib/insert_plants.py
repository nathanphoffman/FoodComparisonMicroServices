import json
import sqlite3
from ..food_types import Plant


def _j(v): return json.dumps(v) if v else None


def insert(conn: sqlite3.Connection, plants: list[Plant]) -> None:
    for p in plants:
        conn.execute(
            """INSERT INTO plants (
                id, food_id, yield_kg_ha, yield_fraction, water_per_kg,
                green_water_per_kg, blue_water_per_kg, grey_water_per_kg,
                soil_erosion, pesticide_kg_ha, fertilizer_kg_ha, emissions_per_kg,
                tillage_events_per_year, co2_capture_kg_ha_yr
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
            (
                p["id"], p["food_id"],
                _j(p.get("yield_kg_ha")),         _j(p.get("yield_fraction")),
                _j(p.get("water_per_kg")),         _j(p.get("green_water_per_kg")),
                _j(p.get("blue_water_per_kg")),    _j(p.get("grey_water_per_kg")),
                _j(p.get("soil_erosion")),         _j(p.get("pesticide_kg_ha")),
                _j(p.get("fertilizer_kg_ha")),     _j(p.get("emissions_per_kg")),
                _j(p.get("tillage_events_per_year")), _j(p.get("co2_capture_kg_ha_yr")),
            ),
        )
