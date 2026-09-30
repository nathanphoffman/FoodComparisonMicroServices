"""
raw_builders.py — assembles the computation wrappers (RawPlant, RawAnimal, RawComposite)
for one food from the lookup tables.
"""

from ...food_types import CompositeIngredient, Plant
from ..types.pesticide_impact import PesticideAssociation
from ..types.raw_animal import RawAnimal, FeedEntry
from ..types.raw_composite import RawComposite, IngredientEntry
from ..types.raw_plant import RawPlant
from ..types.sourced_array import SourcedArray
from .lookup_tables import LookupTables


def build_raw_plant(plant_data: Plant | None, tables: LookupTables) -> RawPlant | None:
    """Builds a RawPlant with its pesticide usage, or None when there is no plant record."""
    if not plant_data:
        return None
    pesticide_associations = [
        PesticideAssociation(plant_pesticide, tables.pesticide_by_id[plant_pesticide.pesticide_id])
        for plant_pesticide in tables.plant_pesticides_by_plant_id.get(plant_data["id"], [])
        if plant_pesticide.pesticide_id in tables.pesticide_by_id
    ]
    return RawPlant(plant_data, pesticide_associations)


def build_raw_animal(food_id: int, tables: LookupTables) -> RawAnimal | None:
    """Builds a RawAnimal with its feed crops, or None if the food has no animal record.
    Feed rows pointing at a crop with no plant record are skipped."""
    animal_data = tables.animal_by_food_id.get(food_id)
    if not animal_data:
        return None
    feed_entries: list[FeedEntry] = []
    for raw_feed in tables.feed_by_animal_id.get(animal_data["id"], []):
        feed_plant = build_raw_plant(tables.plant_by_plant_id.get(raw_feed.plant_id), tables)
        if feed_plant is not None:
            feed_entries.append(FeedEntry(raw_feed, feed_plant))
    return RawAnimal(animal_data, feed_entries)


def build_raw_composite(food_id: int, tables: LookupTables) -> RawComposite | None:
    """Builds a RawComposite for the given food_id, or None if the food isn't a composite."""
    composite = tables.composite_by_food_id.get(food_id)
    if not composite:
        return None
    entries: list[IngredientEntry] = []
    for ingredient in tables.composite_ingredients:
        if ingredient["composite_id"] != composite["id"]:
            continue
        entry = _build_ingredient_entry(ingredient, tables)
        if entry is not None:
            entries.append(entry)
    return RawComposite(composite, entries)


def _build_ingredient_entry(
    ingredient: CompositeIngredient, tables: LookupTables
) -> IngredientEntry | None:
    """One composite ingredient, or None when it carries no footprint: no crop
    (added water), no plant record, or no fraction."""
    plant_id = ingredient["plant_id"]
    if plant_id is None:
        return None
    raw_plant = build_raw_plant(tables.plant_by_plant_id.get(plant_id), tables)
    fraction = SourcedArray(ingredient["fraction"]).weighted_average()
    if raw_plant is None or not fraction:
        return None
    ingredient_food = tables.food_by_id[plant_id]
    return IngredientEntry(
        fraction=fraction,
        base_kg_per_kg=SourcedArray(ingredient.get("base_kg_per_kg")).weighted_average() or 1.0,
        plant=raw_plant,
        land_types=ingredient_food.get("land_types"),
        availability_gg=SourcedArray(ingredient_food.get("availability_gg")).weighted_average(),
    )
