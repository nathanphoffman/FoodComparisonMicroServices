"""
load_foods.py — reads all category JSON files and assembles in-memory data structures.

The JSON files use a flat format: each file is a list of food objects with all
fields (base + animal/plant-specific + feed/pesticide sub-lists) inline.
This module normalises that into the separate lists the insert functions expect.
"""

import json
from pathlib import Path
from dataclasses import dataclass, field
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
    foods: list[Food] = []
    animals: list[Animal] = []
    plants: list[Plant] = []
    animal_feed: list[AnimalFeed] = []
    plant_kills: list[PlantAnimalKill] = []
    plant_pesticides: list[PlantPesticide] = []

    feed_id = 1
    pp_id = 1

    for category in CATEGORY_FILES:
        path = data_dir / "foods" / f"{category}.json"
        if not path.exists():
            continue
        items: list[dict] = json.loads(path.read_text(encoding="utf-8"))

        for item in items:
            food_id = item["id"]

            # --- Base food record ---
            foods.append({k: item[k] for k in FOOD_KEYS if k in item})

            if item.get("type") == "animal":
                # --- Animal record ---
                animal: dict = {"id": food_id, "food_id": food_id}
                for k in ANIMAL_KEYS:
                    animal[k] = item.get(k)
                # bycatch_food_id in JSON maps to bycatch_animal_id in DB
                animal["bycatch_animal_id"] = item.get("bycatch_food_id")
                animals.append(animal)  # type: ignore[arg-type]

                # --- Animal feed records ---
                for entry in item.get("feed") or []:
                    animal_feed.append({
                        "id": feed_id,
                        "animal_id": food_id,
                        "plant_id": entry["food_id"],
                        "kg_feed_per_kg_output": entry["kg_feed_per_kg_output"],
                    })
                    feed_id += 1

            elif item.get("type") == "plant":
                # --- Plant record ---
                plant: dict = {"id": food_id, "food_id": food_id}
                for k in PLANT_KEYS:
                    plant[k] = item.get(k)
                plants.append(plant)  # type: ignore[arg-type]

                # --- Plant pesticide records ---
                for entry in item.get("pesticides") or []:
                    plant_pesticides.append({
                        "id": pp_id,
                        "plant_id": food_id,
                        "pesticide_id": entry["pesticide_id"],
                        "kg_ha": entry.get("kg_ha"),
                    })
                    pp_id += 1

    return CategoryData(
        foods=foods,
        animals=animals,
        plants=plants,
        animal_feed=animal_feed,
        plant_kills=plant_kills,
        plant_pesticides=plant_pesticides,
    )
