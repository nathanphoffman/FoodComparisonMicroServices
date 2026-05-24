import sqlite3
from ..food_types import Food, Plant, Animal, Pesticide, PlantPesticide, AnimalFeed
from .types.raw_food import RawFood
from .types.raw_plant import RawPlant, PesticideAssociation
from .types.raw_animal import RawAnimal, FeedEntry
from .types.raw_animal_feed import RawAnimalFeed
from .types.raw_pesticide import RawPesticide
from .types.raw_plant_pesticide import RawPlantPesticide

SQL = """INSERT INTO foods_normalized (
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
    conn: sqlite3.Connection,
    foods: list[Food],
    plants: list[Plant],
    animals: list[Animal],
    plant_pesticides: list[PlantPesticide],
    pesticides: list[Pesticide],
    animal_feed: list[AnimalFeed],
) -> None:
    plant_by_food_id  = {p["food_id"]: p for p in plants}
    plant_by_plant_id = {p["id"]: p for p in plants}
    animal_by_food_id = {a["food_id"]: a for a in animals}
    pesticide_by_id   = {p["id"]: RawPesticide(p) for p in pesticides}

    plant_pesticides_by_plant_id: dict[int, list[RawPlantPesticide]] = {}
    for pp in plant_pesticides:
        plant_pesticides_by_plant_id.setdefault(pp["plant_id"], []).append(RawPlantPesticide(pp))

    feed_by_animal_id: dict[int, list[RawAnimalFeed]] = {}
    for fe in animal_feed:
        feed_by_animal_id.setdefault(fe["animal_id"], []).append(RawAnimalFeed(fe))

    def build_raw_plant(plant_data: Plant) -> RawPlant:
        assocs = [
            PesticideAssociation(pp, pesticide_by_id[pp.pesticide_id])
            for pp in plant_pesticides_by_plant_id.get(plant_data["id"], [])
            if pp.pesticide_id in pesticide_by_id
        ]
        return RawPlant(plant_data, assocs)

    for food in foods:
        plant_data  = plant_by_food_id.get(food["id"])
        animal_data = animal_by_food_id.get(food["id"])

        raw_plant = build_raw_plant(plant_data) if plant_data else None

        raw_animal = None
        if animal_data:
            entries = [
                FeedEntry(fe, build_raw_plant(plant_by_plant_id[fe.plant_id]))
                for fe in feed_by_animal_id.get(animal_data["id"], [])
                if fe.plant_id in plant_by_plant_id
            ]
            raw_animal = RawAnimal(animal_data, entries)

        raw_food = RawFood(food, raw_plant, raw_animal)
        conn.execute(SQL, raw_food.to_normalized().to_db_params())

        feed_row = raw_food.to_feed_normalized()
        if feed_row:
            conn.execute(SQL, feed_row.to_db_params())
