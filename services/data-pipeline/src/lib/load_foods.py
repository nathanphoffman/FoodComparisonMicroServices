"""
load_foods.py — reads all category JSON files and assembles in-memory data structures.
Port of load-category-foods.ts.
"""

import json
from pathlib import Path
from dataclasses import dataclass
from ..types import Food, Animal, Plant, AnimalFeed, PlantAnimalKill, PlantPesticide

CATEGORY_FILES = [
    "dairy", "eggs", "feeds", "fruits", "grains",
    "leafy", "legumes", "meats", "nuts", "oils",
    "seafood", "seeds", "vegetables",
]


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

    for category in CATEGORY_FILES:
        path = data_dir / "foods" / f"{category}.json"
        if not path.exists():
            continue
        raw: dict = json.loads(path.read_text(encoding="utf-8"))

        foods.extend(raw.get("foods", []))
        animals.extend(raw.get("animals", []))
        plants.extend(raw.get("plants", []))
        animal_feed.extend(raw.get("animal_feed", []))
        plant_kills.extend(raw.get("plant_kills", []))
        plant_pesticides.extend(raw.get("plant_pesticides", []))

    return CategoryData(
        foods=foods,
        animals=animals,
        plants=plants,
        animal_feed=animal_feed,
        plant_kills=plant_kills,
        plant_pesticides=plant_pesticides,
    )
