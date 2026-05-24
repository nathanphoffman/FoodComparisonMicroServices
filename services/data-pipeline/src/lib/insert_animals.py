import json
import sqlite3
from ..food_types import Animal
from .validate import assert_sourced_array


def insert(conn: sqlite3.Connection, animals: list[Animal]) -> None:
    for a in animals:
        lbl = f"animal {a['id']}"
        assert_sourced_array(a.get("neuron_count"),  f"{lbl}.neuron_count")
        assert_sourced_array(a.get("weight_kg"),     f"{lbl}.weight_kg")
        assert_sourced_array(a.get("yield_fraction"),f"{lbl}.yield_fraction")
        # pasture_ha_per_kg_output and native_fraction are optional (grazing animals only)
        conn.execute(
            """INSERT INTO animals (
                id, food_id, neuron_count, weight_kg, bycatch_animal_id, bycatch_amount,
                yield_fraction, pasture_ha_per_kg_output, pasture_green_water_l_per_ha,
                native_fraction, ch4_kg_per_kg_output, n2o_kg_per_kg_output, co2_kg_per_kg_output
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
            (
                a["id"], a["food_id"],
                json.dumps(a["neuron_count"])              if a.get("neuron_count")              else None,
                json.dumps(a["weight_kg"])                 if a.get("weight_kg")                 else None,
                a.get("bycatch_animal_id"),
                json.dumps(a["bycatch_amount"])            if a.get("bycatch_amount")            else None,
                json.dumps(a["yield_fraction"])            if a.get("yield_fraction")            else None,
                json.dumps(a["pasture_ha_per_kg_output"])  if a.get("pasture_ha_per_kg_output")  else None,
                json.dumps(a["pasture_green_water_l_per_ha"]) if a.get("pasture_green_water_l_per_ha") else None,
                json.dumps(a["native_fraction"])           if a.get("native_fraction")           else None,
                json.dumps(a["ch4_kg_per_kg_output"])      if a.get("ch4_kg_per_kg_output")      else None,
                json.dumps(a["n2o_kg_per_kg_output"])      if a.get("n2o_kg_per_kg_output")      else None,
                json.dumps(a["co2_kg_per_kg_output"])      if a.get("co2_kg_per_kg_output")      else None,
            ),
        )
