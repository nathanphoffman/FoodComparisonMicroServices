"""
load_foods.py — reads all category JSON files and assembles in-memory data structures.

The JSON files use a flat format: each file is a list of food objects with all
fields (base + animal/plant-specific + feed/pesticide sub-lists) inline.
This module normalises that into the separate lists the insert functions expect.
"""

import json
from pathlib import Path
from dataclasses import dataclass, field

from ..food_types import (
    Food, Animal, Plant, AnimalFeed, PlantAnimalKill, PlantPesticide, Composite, CompositeIngredient,
)
from .validate import assert_land_types, assert_composite_ingredients

CATEGORY_FILES = [
    "beverages", "dairy", "eggs", "feeds", "fruits", "grains",
    "leafy", "legumes", "meats", "nuts", "oils",
    "seafood", "seeds", "sweeteners", "vegetables",
    # Must stay last: composites are built from foods in the other files.
    "composites",
]

FOOD_KEYS = {
    "id", "slug", "name", "type", "human_food", "tags", "nutrition", "availability_gg",
    "sentient_harm_explanation", "land_types", "category",
}

ANIMAL_KEYS = {
    "neuron_count", "weight_kg", "lifetime_output_kg", "bycatch_amount",
    "yield_fraction", "pasture_ha_per_kg_output", "pasture_green_water_l_per_ha",
    "native_fraction", "ch4_kg_per_kg_output", "n2o_kg_per_kg_output", "co2_kg_per_kg_output",
    "offspring_deaths_per_animal", "offspring_captivity_years",
}

PLANT_KEYS = {
    "yield_kg_ha", "yield_fraction", "water_per_kg",
    "green_water_per_kg", "blue_water_per_kg", "grey_water_per_kg",
    "soil_erosion", "pesticide_kg_ha", "fertilizer_kg_ha", "emissions_per_kg",
    "tillage_events_per_year", "co2_capture_kg_ha_yr", "cooked_weight_ratio",
    "farm_gate_emissions_per_kg",
    "wild_fish_kg_per_kg", "wild_fish_neuron_count", "wild_fish_weight_kg",
    "wild_fish_lifespan_years",
}

# A food with an "ingredients" list is a composite: its crop impacts are built from
# its ingredients, plus these processing extras. See data/json/SCHEMA.md.
COMPOSITE_KEYS = {"processing_emissions_per_kg", "processing_water_per_kg"}


@dataclass
class CategoryData:
    foods: list[Food]
    animals: list[Animal]
    plants: list[Plant]
    animal_feed: list[AnimalFeed]
    plant_kills: list[PlantAnimalKill]
    plant_pesticides: list[PlantPesticide]
    composites: list[Composite] = field(default_factory=list)
    composite_ingredients: list[CompositeIngredient] = field(default_factory=list)


def load_category_foods(data_dir: Path) -> CategoryData:
    """Loads all category JSON files and returns assembled in-memory data structures."""
    all_foods: list[Food] = []
    all_animals: list[Animal] = []
    all_plants: list[Plant] = []
    all_animal_feed: list[AnimalFeed] = []
    all_plant_kills: list[PlantAnimalKill] = []
    all_plant_pesticides: list[PlantPesticide] = []
    composite_items: list[dict] = []
    next_feed_id = 1
    next_plant_pesticide_id = 1

    for category_name in CATEGORY_FILES:
        category_path = data_dir / "foods" / f"{category_name}.json"
        if not category_path.exists():
            continue
        category_items: list[dict] = json.loads(category_path.read_text(encoding="utf-8"))
        for item in category_items:
            assert_land_types(item.get("land_types"), f"{item.get('slug')}.land_types")
            all_foods.append(_extract_food_base(item))
            if "ingredients" in item:
                composite_items.append(item)
            elif item.get("type") == "animal":
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

    composites, composite_ingredients = _extract_composites(composite_items, all_foods, all_plants)

    return CategoryData(
        foods=all_foods,
        animals=all_animals,
        plants=all_plants,
        animal_feed=all_animal_feed,
        plant_kills=all_plant_kills,
        plant_pesticides=all_plant_pesticides,
        composites=composites,
        composite_ingredients=composite_ingredients,
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
    animal_record["bycatch_food_slug"] = item.get("bycatch_food_slug")
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


def _extract_composites(
    composite_items: list[dict], foods: list[Food], plants: list[Plant]
) -> tuple[list[Composite], list[CompositeIngredient]]:
    """Builds composite records and their ingredient rows, resolving ingredient slugs
    to plant ids. Ingredients must be plant foods (animal composites aren't supported)."""
    food_by_slug = {food["slug"]: food for food in foods}
    plant_ids = {plant["id"] for plant in plants}
    composites: list[Composite] = []
    ingredients: list[CompositeIngredient] = []
    for item in composite_items:
        assert_composite_ingredients(item, food_by_slug, plant_ids)
        composite: dict = {"id": item["id"], "food_id": item["id"]}
        for field_name in COMPOSITE_KEYS:
            composite[field_name] = item.get(field_name)
        composites.append(composite)  # type: ignore[arg-type]
        for ingredient in item["ingredients"]:
            slug = ingredient.get("food_slug")
            ingredients.append({
                "id": len(ingredients) + 1,
                "composite_id": item["id"],
                "plant_id": food_by_slug[slug]["id"] if slug else None,
                "label": slug or ingredient["label"],
                "fraction": ingredient["fraction"],
                "base_kg_per_kg": ingredient.get("base_kg_per_kg"),
            })
    return composites, ingredients
