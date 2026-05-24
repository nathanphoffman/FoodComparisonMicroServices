"""
insert_plants.py — inserts plant records into the plants table.

Plants are Tier 3 and depend on foods being inserted first.
"""

import json
import sqlite3

from ..food_types import Plant


def encode_optional_json(sourced_array: list | None) -> str | None:
    """Returns a JSON-encoded sourced array, or None if the array is absent."""
    return json.dumps(sourced_array) if sourced_array else None


def insert(connection: sqlite3.Connection, plants: list[Plant]) -> None:
    """Inserts all plant records into the plants table."""
    for plant in plants:
        connection.execute(
            """INSERT INTO plants (
                id, food_id, yield_kg_ha, yield_fraction, water_per_kg,
                green_water_per_kg, blue_water_per_kg, grey_water_per_kg,
                soil_erosion, pesticide_kg_ha, fertilizer_kg_ha, emissions_per_kg,
                tillage_events_per_year, co2_capture_kg_ha_yr
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
            (
                plant["id"],
                plant["food_id"],
                encode_optional_json(plant.get("yield_kg_ha")),
                encode_optional_json(plant.get("yield_fraction")),
                encode_optional_json(plant.get("water_per_kg")),
                encode_optional_json(plant.get("green_water_per_kg")),
                encode_optional_json(plant.get("blue_water_per_kg")),
                encode_optional_json(plant.get("grey_water_per_kg")),
                encode_optional_json(plant.get("soil_erosion")),
                encode_optional_json(plant.get("pesticide_kg_ha")),
                encode_optional_json(plant.get("fertilizer_kg_ha")),
                encode_optional_json(plant.get("emissions_per_kg")),
                encode_optional_json(plant.get("tillage_events_per_year")),
                encode_optional_json(plant.get("co2_capture_kg_ha_yr")),
            ),
        )
