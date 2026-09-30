"""
loader.py — reads every category file in order and sorts each item into the
food / animal / plant / composite lists.
"""

import json
from collections.abc import Iterator
from dataclasses import dataclass, field
from pathlib import Path

from ...food_types import (
    Food, Animal, Plant, AnimalFeed, PlantAnimalKill, PlantPesticide, Composite, CompositeIngredient,
)
from ..validate import assert_land_types
from .category_keys import CATEGORY_FILES
from .composites import extract_composites
from .extract_records import (
    extract_animal_feed_entries,
    extract_animal_record,
    extract_food_base,
    extract_plant_pesticide_entries,
    extract_plant_record,
)


@dataclass
class CategoryData:
    foods: list[Food] = field(default_factory=list)
    animals: list[Animal] = field(default_factory=list)
    plants: list[Plant] = field(default_factory=list)
    animal_feed: list[AnimalFeed] = field(default_factory=list)
    plant_kills: list[PlantAnimalKill] = field(default_factory=list)
    plant_pesticides: list[PlantPesticide] = field(default_factory=list)
    composites: list[Composite] = field(default_factory=list)
    composite_ingredients: list[CompositeIngredient] = field(default_factory=list)


def load_category_foods(data_dir: Path) -> CategoryData:
    """Loads all category JSON files and returns assembled in-memory data structures."""
    category_data = CategoryData()
    composite_items: list[dict] = []
    for item in _read_category_items(data_dir):
        assert_land_types(item.get("land_types"), f"{item.get('slug')}.land_types")
        category_data.foods.append(extract_food_base(item))
        if "ingredients" in item:
            composite_items.append(item)
        elif item.get("type") == "animal":
            _add_animal(category_data, item)
        elif item.get("type") == "plant":
            _add_plant(category_data, item)

    category_data.composites, category_data.composite_ingredients = extract_composites(
        composite_items, category_data.foods, category_data.plants
    )
    return category_data


def _read_category_items(data_dir: Path) -> Iterator[dict]:
    """Yields every food item from the category files, in CATEGORY_FILES order.
    Missing category files are skipped."""
    for category_name in CATEGORY_FILES:
        category_path = data_dir / "foods" / f"{category_name}.json"
        if not category_path.exists():
            continue
        yield from json.loads(category_path.read_text(encoding="utf-8"))


def _add_animal(category_data: CategoryData, item: dict) -> None:
    """Adds an animal record and its feed rows. Feed row ids run on from the last one."""
    category_data.animals.append(extract_animal_record(item))
    category_data.animal_feed.extend(
        extract_animal_feed_entries(item, first_id=len(category_data.animal_feed) + 1)
    )


def _add_plant(category_data: CategoryData, item: dict) -> None:
    """Adds a plant record and its pesticide rows. Pesticide row ids run on from the last one."""
    category_data.plants.append(extract_plant_record(item))
    category_data.plant_pesticides.extend(
        extract_plant_pesticide_entries(item, first_id=len(category_data.plant_pesticides) + 1)
    )
