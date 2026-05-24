"""
load_foods.py — reads all category JSON files and assembles in-memory data structures.

The JSON files use a flat format: each file is a list of food objects with all
fields (base + animal/plant-specific + feed/pesticide sub-lists) inline.
This module normalises that into the separate lists the insert functions expect.
"""

import json
from pathlib import Path
from dataclasses import dataclass

from ..food_types import Food, Animal, Plant, AnimalFeed, PlantAnimalKill, PlantPesticide

CATEGORY_FILES = [
    "dairy", "eggs", "feeds", "fruits", "grains",
    "leafy", "legumes", "meats", "nuts", "oils",
    "seafood", "seeds", "vegetables",
]

FOOD_KEYS = {"id", "slug", "name", "type", "human_food", "tags", "nutrition"}

ANIMAL_KEYS = {
    "neuron_count", "weight_kg", "bycatch_amount",
    "yield_fraction", "pasture_ha_per_kg_output", "pasture_green_water_l_per_ha",
    "native_fraction", "ch4_kg_per_kg_output", "n2o_kg_per_kg_output", "co2_kg_per_kg_output",
}

PLANT_KEYS = {
    "yield_kg_ha", "yield_fraction", "water_per_kg",
    "green_water_per_kg", "blue_water_per_kg", "grey_water_per_kg",
    "soil_erosion", "pesticide_kg_ha", "fertilizer_kg_ha", "emissions_per_kg",
    "tillage_events_per_year", "co2_capture_kg_ha_yr",
}


@dataclass
class CategoryData:
    foods: list[Food]
    animals: list[Animal]
    plants: list[Plant]
    animal_feed: list[AnimalFeed]
    plant_kills: list[PlantAnimalKill]
    plant_pesticides: list[PlantPesticide]


def load_category_foods(data_dir: Path) -> CategoryData:
    """Loads all category JSON files and returns assembled in-memory data structures."""
    all_foods: list[Food] = []
    all_animals: list[Animal] = []
    all_plants: list[Plant] = []
    all_animal_feed: list[AnimalFeed] = []
    all_plant_kills: list[PlantAnimalKill] = []
    all_plant_pesticides: list[PlantPesticide] = []
    next_feed_id = 1
    next_plant_pesticide_id = 1

    for category_name in CATEGORY_FILES:
        category_path = data_dir / "foods" / f"{category_name}.json"
        if not category_path.exists():
            continue
        category_items: list[dict] = json.loads(category_path.read_text(encoding="utf-8"))
        for item in category_items:
            all_foods.append(_extract_food_base(item))
            if item.get("type") == "animal":
                all_animals.append(_extract_animal_record(item))
                new_feed_entries, next_feed_id = _extract_animal_feed_entries(
                    item, next_feed_id
                )
                all_animal_feed.extend(new_feed_entries)
            elif item.get("type") == "plant":
                all_plants.append(_extract_plant_record(item))
                new_pesticide_entries, next_plant_pesticide_id = _extract_plant_pesticide_entries(
                    item, next_plant_pesticide_id
                )
                all_plant_pesticides.extend(new_pesticide_entries)

    return CategoryData(
        foods=all_foods,
        animals=all_animals,
        plants=all_plants,
        animal_feed=all_animal_feed,
        plant_kills=all_plant_kills,
        plant_pesticides=all_plant_pesticides,
    )


def _extract_food_base(item: dict) -> Food:
    """Extracts only the base food fields from a flat JSON item."""
    return {field_name: item[field_name] for field_name in FOOD_KEYS if field_name in item}  # type: ignore[return-value]


def _extract_animal_record(item: dict) -> Animal:
    """Extracts animal-specific fields from a flat JSON item."""
    animal_record: dict = {"id": item["id"], "food_id": item["id"]}
    for field_name in ANIMAL_KEYS:
        animal_record[field_name] = item.get(field_name)
    # The JSON uses bycatch_food_id; the database column is named bycatch_animal_id.
    animal_record["bycatch_animal_id"] = item.get("bycatch_food_id")
    return animal_record  # type: ignore[return-value]


def _extract_plant_record(item: dict) -> Plant:
    """Extracts plant-specific fields from a flat JSON item."""
    plant_record: dict = {"id": item["id"], "food_id": item["id"]}
    for field_name in PLANT_KEYS:
        plant_record[field_name] = item.get(field_name)
    return plant_record  # type: ignore[return-value]


def _extract_animal_feed_entries(
    item: dict, next_feed_id: int
) -> tuple[list[AnimalFeed], int]:
    """Extracts animal feed associations from a flat JSON item, returning updated next id."""
    feed_entries: list[AnimalFeed] = []
    for feed_entry in item.get("feed") or []:
        feed_entries.append({
            "id": next_feed_id,
            "animal_id": item["id"],
            "plant_id": feed_entry["food_id"],
            "kg_feed_per_kg_output": feed_entry["kg_feed_per_kg_output"],
        })
        next_feed_id += 1
    return feed_entries, next_feed_id


def _extract_plant_pesticide_entries(
    item: dict, next_plant_pesticide_id: int
) -> tuple[list[PlantPesticide], int]:
    """Extracts plant-pesticide associations from a flat JSON item, returning updated next id."""
    pesticide_entries: list[PlantPesticide] = []
    for pesticide_entry in item.get("pesticides") or []:
        pesticide_entries.append({
            "id": next_plant_pesticide_id,
            "plant_id": item["id"],
            "pesticide_id": pesticide_entry["pesticide_id"],
            "kg_ha": pesticide_entry.get("kg_ha"),
        })
        next_plant_pesticide_id += 1
    return pesticide_entries, next_plant_pesticide_id
