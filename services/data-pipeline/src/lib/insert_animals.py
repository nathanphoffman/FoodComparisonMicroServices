"""
insert_animals.py — inserts animal records into the animals table.

Animals are Tier 3 and depend on foods being inserted first.
pasture_ha_per_kg_output and native_fraction are optional — only grazing animals have them.
"""

import json
import sqlite3

from ..food_types import Animal
from .validate import assert_sourced_array


def _encode_if_present(sourced_array: list | None) -> str | None:
    """Returns a JSON-encoded sourced array, or None if the array is absent."""
    return json.dumps(sourced_array) if sourced_array else None


def insert(connection: sqlite3.Connection, animals: list[Animal]) -> None:
    """Inserts all animal records into the animals table."""
    for animal in animals:
        animal_label = f"animal {animal['id']}"
        assert_sourced_array(animal.get("neuron_count"),   f"{animal_label}.neuron_count")
        assert_sourced_array(animal.get("weight_kg"),      f"{animal_label}.weight_kg")
        assert_sourced_array(animal.get("yield_fraction"), f"{animal_label}.yield_fraction")
        # pasture_ha_per_kg_output and native_fraction are optional (grazing animals only)
        connection.execute(
            """INSERT INTO animals (
                id, food_id, neuron_count, weight_kg, bycatch_animal_id, bycatch_amount,
                yield_fraction, pasture_ha_per_kg_output, pasture_green_water_l_per_ha,
                native_fraction, ch4_kg_per_kg_output, n2o_kg_per_kg_output, co2_kg_per_kg_output
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
            (
                animal["id"],
                animal["food_id"],
                _encode_if_present(animal.get("neuron_count")),
                _encode_if_present(animal.get("weight_kg")),
                animal.get("bycatch_animal_id"),
                _encode_if_present(animal.get("bycatch_amount")),
                _encode_if_present(animal.get("yield_fraction")),
                _encode_if_present(animal.get("pasture_ha_per_kg_output")),
                _encode_if_present(animal.get("pasture_green_water_l_per_ha")),
                _encode_if_present(animal.get("native_fraction")),
                _encode_if_present(animal.get("ch4_kg_per_kg_output")),
                _encode_if_present(animal.get("n2o_kg_per_kg_output")),
                _encode_if_present(animal.get("co2_kg_per_kg_output")),
            ),
        )
