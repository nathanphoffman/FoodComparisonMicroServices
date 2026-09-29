"""
insert_composites.py — inserts composite food records and their ingredient rows.

Composites are Tier 4 and depend on foods and plants being inserted first.
"""

import json
import sqlite3

from ..food_types import Composite, CompositeIngredient


def insert(
    connection: sqlite3.Connection,
    composites: list[Composite],
    ingredients: list[CompositeIngredient],
) -> None:
    """Inserts all composites into the composites table and their ingredients into composite_ingredients."""
    for composite in composites:
        connection.execute(
            "INSERT INTO composites (id, food_id, processing_emissions_per_kg, processing_water_per_kg) VALUES (?, ?, ?, ?)",
            (
                composite["id"],
                composite["food_id"],
                _json_or_none(composite.get("processing_emissions_per_kg")),
                _json_or_none(composite.get("processing_water_per_kg")),
            ),
        )
    for ingredient in ingredients:
        connection.execute(
            "INSERT INTO composite_ingredients (id, composite_id, plant_id, label, fraction, base_kg_per_kg) VALUES (?, ?, ?, ?, ?, ?)",
            (
                ingredient["id"],
                ingredient["composite_id"],
                ingredient["plant_id"],
                ingredient["label"],
                json.dumps(ingredient["fraction"]),
                _json_or_none(ingredient.get("base_kg_per_kg")),
            ),
        )


def _json_or_none(value: list | None) -> str | None:
    return json.dumps(value) if value else None
