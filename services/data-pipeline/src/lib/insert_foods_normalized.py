"""
insert_foods_normalized.py — builds and inserts pre-computed normalized rows.

This is Tier 5 and must run last. It joins all prior tables in memory, computes
weighted averages for every metric, and writes one or two rows per food into
the foods_normalized table (the main row + an optional feed-impact row for animals).
"""

import sqlite3

from ..food_types import Food, Plant, Animal, Pesticide, PlantPesticide, AnimalFeed
from .types.raw_food import RawFood
from .types.raw_plant import RawPlant, PesticideAssociation
from .types.raw_animal import RawAnimal, FeedEntry
from .types.raw_animal_feed import RawAnimalFeed
from .types.raw_pesticide import RawPesticide
from .types.raw_plant_pesticide import RawPlantPesticide

INSERT_SQL = """INSERT INTO foods_normalized (
  food_id, is_feed, slug, name, type, tags, human_food,
  calories, fat, sat_fat, protein, fiber,
  sodium, carbs, sugar, cholesterol, trans_fat,
  yield_kg_ha, water_per_kg, green_water_per_kg, blue_water_per_kg, grey_water_per_kg,
  soil_erosion, pesticide_kg_ha,
  fertilizer_kg_ha, emissions_per_kg, tillage_events_per_year, co2_capture_kg_ha_yr,
  pesticide_freshwater_paf, pesticide_terrestrial_paf, pesticide_insect_paf,
  pesticide_bee_hazard, pesticide_kg_per_kg_food,
  land_m2_per_kg,
  neuron_count, weight_kg, yield_fraction, pasture_ha_per_kg_output,
  pasture_green_water_l_per_ha, native_fraction, bycatch_amount,
  ch4_kg_per_kg_output, n2o_kg_per_kg_output, co2_kg_per_kg_output
) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)"""


def insert(
    connection: sqlite3.Connection,
    foods: list[Food],
    plants: list[Plant],
    animals: list[Animal],
    plant_pesticides: list[PlantPesticide],
    pesticides: list[Pesticide],
    animal_feed: list[AnimalFeed],
) -> None:
    """Builds and inserts all normalized rows into the foods_normalized table."""
    plant_by_food_id, plant_by_plant_id = _index_plants(plants)
    animal_by_food_id = _index_animals(animals)
    pesticide_by_id = _index_pesticides(pesticides)
    plant_pesticides_by_plant_id = _index_plant_pesticides(plant_pesticides)
    feed_by_animal_id = _index_animal_feed(animal_feed)

    for food in foods:
        raw_plant = _build_raw_plant(
            food["id"], plant_by_food_id, plant_pesticides_by_plant_id, pesticide_by_id
        )
        raw_animal = _build_raw_animal(
            food["id"], animal_by_food_id, feed_by_animal_id,
            plant_by_plant_id, plant_pesticides_by_plant_id, pesticide_by_id
        )
        raw_food = RawFood(food, raw_plant, raw_animal)
        connection.execute(INSERT_SQL, raw_food.to_normalized().to_db_params())
        feed_row = raw_food.to_feed_normalized()
        if feed_row:
            connection.execute(INSERT_SQL, feed_row.to_db_params())


def _index_plants(
    plants: list[Plant],
) -> tuple[dict[int, Plant], dict[int, Plant]]:
    """Returns plants indexed by food_id and by plant id."""
    return (
        {plant["food_id"]: plant for plant in plants},
        {plant["id"]: plant for plant in plants},
    )


def _index_animals(animals: list[Animal]) -> dict[int, Animal]:
    """Returns animals indexed by food_id."""
    return {animal["food_id"]: animal for animal in animals}


def _index_pesticides(pesticides: list[Pesticide]) -> dict[int, RawPesticide]:
    """Returns RawPesticide wrappers indexed by pesticide id."""
    return {pesticide["id"]: RawPesticide(pesticide) for pesticide in pesticides}


def _index_plant_pesticides(
    plant_pesticides: list[PlantPesticide],
) -> dict[int, list[RawPlantPesticide]]:
    """Returns RawPlantPesticide wrappers grouped by plant_id."""
    index: dict[int, list[RawPlantPesticide]] = {}
    for plant_pesticide in plant_pesticides:
        index.setdefault(plant_pesticide["plant_id"], []).append(
            RawPlantPesticide(plant_pesticide)
        )
    return index


def _index_animal_feed(animal_feed: list[AnimalFeed]) -> dict[int, list[RawAnimalFeed]]:
    """Returns RawAnimalFeed wrappers grouped by animal_id."""
    index: dict[int, list[RawAnimalFeed]] = {}
    for feed_entry in animal_feed:
        index.setdefault(feed_entry["animal_id"], []).append(RawAnimalFeed(feed_entry))
    return index


def _build_raw_plant(
    food_id: int,
    plant_by_food_id: dict[int, Plant],
    plant_pesticides_by_plant_id: dict[int, list[RawPlantPesticide]],
    pesticide_by_id: dict[int, RawPesticide],
) -> RawPlant | None:
    """Builds a RawPlant for the given food_id, or None if the food has no plant record."""
    plant_data = plant_by_food_id.get(food_id)
    if not plant_data:
        return None
    pesticide_associations = [
        PesticideAssociation(plant_pesticide, pesticide_by_id[plant_pesticide.pesticide_id])
        for plant_pesticide in plant_pesticides_by_plant_id.get(plant_data["id"], [])
        if plant_pesticide.pesticide_id in pesticide_by_id
    ]
    return RawPlant(plant_data, pesticide_associations)


def _build_raw_animal(
    food_id: int,
    animal_by_food_id: dict[int, Animal],
    feed_by_animal_id: dict[int, list[RawAnimalFeed]],
    plant_by_plant_id: dict[int, Plant],
    plant_pesticides_by_plant_id: dict[int, list[RawPlantPesticide]],
    pesticide_by_id: dict[int, RawPesticide],
) -> RawAnimal | None:
    """Builds a RawAnimal for the given food_id, or None if the food has no animal record."""
    animal_data = animal_by_food_id.get(food_id)
    if not animal_data:
        return None
    feed_entries = [
        FeedEntry(
            raw_feed,
            _build_raw_plant(
                raw_feed.plant_id, plant_by_plant_id,
                plant_pesticides_by_plant_id, pesticide_by_id
            ),
        )
        for raw_feed in feed_by_animal_id.get(animal_data["id"], [])
        if raw_feed.plant_id in plant_by_plant_id
        and _build_raw_plant(
            raw_feed.plant_id, plant_by_plant_id,
            plant_pesticides_by_plant_id, pesticide_by_id
        ) is not None
    ]
    return RawAnimal(animal_data, feed_entries)
