"""
extract_records.py — splits one flat JSON food item into the separate food, animal,
plant, feed and pesticide records the insert functions expect.
"""

from ...food_types import Food, Animal, Plant, AnimalFeed, PlantPesticide
from .category_keys import ANIMAL_KEYS, FOOD_KEYS, PLANT_KEYS


def extract_food_base(item: dict) -> Food:
    """Extracts only the base food fields from a flat JSON item."""
    return {field_name: item[field_name] for field_name in FOOD_KEYS if field_name in item}  # type: ignore[return-value]


def extract_animal_record(item: dict) -> Animal:
    """Extracts animal-specific fields from a flat JSON item."""
    animal_record: dict = {"id": item["id"], "food_id": item["id"]}
    for field_name in ANIMAL_KEYS:
        animal_record[field_name] = item.get(field_name)
    # The JSON uses bycatch_food_id; the database column is named bycatch_animal_id.
    animal_record["bycatch_animal_id"] = item.get("bycatch_food_id")
    animal_record["bycatch_food_slug"] = item.get("bycatch_food_slug")
    return animal_record  # type: ignore[return-value]


def extract_plant_record(item: dict) -> Plant:
    """Extracts plant-specific fields from a flat JSON item."""
    plant_record: dict = {"id": item["id"], "food_id": item["id"]}
    for field_name in PLANT_KEYS:
        plant_record[field_name] = item.get(field_name)
    return plant_record  # type: ignore[return-value]


def extract_animal_feed_entries(item: dict, first_id: int) -> list[AnimalFeed]:
    """Extracts animal feed associations from a flat JSON item, numbered from first_id."""
    return [
        {
            "id": first_id + position,
            "animal_id": item["id"],
            "plant_id": feed_entry["food_id"],
            "kg_feed_per_kg_output": feed_entry["kg_feed_per_kg_output"],
        }
        for position, feed_entry in enumerate(item.get("feed") or [])
    ]


def extract_plant_pesticide_entries(item: dict, first_id: int) -> list[PlantPesticide]:
    """Extracts plant-pesticide associations from a flat JSON item, numbered from first_id."""
    return [
        {
            "id": first_id + position,
            "plant_id": item["id"],
            "pesticide_id": pesticide_entry["pesticide_id"],
            "kg_ha": pesticide_entry.get("kg_ha"),
        }
        for position, pesticide_entry in enumerate(item.get("pesticides") or [])
    ]
