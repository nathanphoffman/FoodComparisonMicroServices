"""
insert_foods_normalized — builds and inserts pre-computed normalized rows.

This is Tier 5 and must run last. It joins all prior tables in memory, computes
weighted averages for every metric, and writes one or two rows per food into
the foods_normalized table (the main row + an optional feed-impact row for animals).

  - lookup_tables.py — indexes the loaded records by id so they can be joined
  - raw_builders.py  — assembles each food's RawPlant / RawAnimal / RawComposite
"""

import sqlite3

from ...food_types import (
    Food, Plant, Animal, Pesticide, PlantPesticide, AnimalFeed, Composite, CompositeIngredient,
)
from ..types.food_normalized import FoodNormalized
from ..types.raw_food import RawFood
from .lookup_tables import LookupTables
from .raw_builders import build_raw_animal, build_raw_composite, build_raw_plant

INSERT_SQL = """INSERT INTO foods_normalized (
  food_id, is_feed, region, slug, name, type, tags, human_food,
  calories, fat, sat_fat, protein, fiber,
  sodium, carbs, sugar, cholesterol, trans_fat,
  yield_kg_ha, water_per_kg, green_water_per_kg, blue_water_per_kg, grey_water_per_kg,
  soil_erosion, pesticide_kg_ha,
  fertilizer_kg_ha, emissions_per_kg, tillage_events_per_year, co2_capture_kg_ha_yr,
  pesticide_freshwater_paf, pesticide_terrestrial_paf, pesticide_insect_paf,
  pesticide_bee_hazard, pesticide_kg_per_kg_food,
  land_m2_per_kg,
  neuron_count, weight_kg, lifetime_output_kg,
  offspring_deaths_per_animal, offspring_captivity_years, yield_fraction, pasture_ha_per_kg_output,
  pasture_green_water_l_per_ha, native_fraction, bycatch_amount, bycatch_food_slug,
  ch4_kg_per_kg_output, n2o_kg_per_kg_output, co2_kg_per_kg_output,
  wild_fish_kg_per_kg, wild_fish_neuron_count, wild_fish_weight_kg, wild_fish_lifespan_years,
  availability_gg, sentient_harm_explanation, land_types, category
) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)"""


def insert(
    connection: sqlite3.Connection,
    foods: list[Food],
    plants: list[Plant],
    animals: list[Animal],
    plant_pesticides: list[PlantPesticide],
    pesticides: list[Pesticide],
    animal_feed: list[AnimalFeed],
    region: str,
    composites: list[Composite] | None = None,
    composite_ingredients: list[CompositeIngredient] | None = None,
) -> None:
    """Builds and inserts all normalized rows for one region into the foods_normalized table."""
    tables = LookupTables.build(
        foods, plants, animals, plant_pesticides, pesticides, animal_feed,
        composites or [], composite_ingredients or [],
    )
    for food in foods:
        raw_food = RawFood(
            food,
            build_raw_plant(tables.plant_by_food_id.get(food["id"]), tables),
            build_raw_animal(food["id"], tables),
            build_raw_composite(food["id"], tables),
        )
        _insert_row(connection, raw_food.to_normalized(), region)
        feed_row = raw_food.to_feed_normalized()
        if feed_row:
            _insert_row(connection, feed_row, region)


def _insert_row(connection: sqlite3.Connection, row: FoodNormalized, region: str) -> None:
    row.region = region
    connection.execute(INSERT_SQL, row.to_db_params())
