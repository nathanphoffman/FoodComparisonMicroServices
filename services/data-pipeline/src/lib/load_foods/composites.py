"""
composites.py — builds composite food records and their ingredient rows.
"""

from ...food_types import Food, Plant, Composite, CompositeIngredient
from ..validate import assert_composite_ingredients
from .category_keys import COMPOSITE_KEYS


def extract_composites(
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
        composites.append(_composite_record(item))
        for ingredient in item["ingredients"]:
            ingredients.append(_ingredient_row(item, ingredient, food_by_slug, next_id=len(ingredients) + 1))
    return composites, ingredients


def _composite_record(item: dict) -> Composite:
    composite: dict = {"id": item["id"], "food_id": item["id"]}
    for field_name in COMPOSITE_KEYS:
        composite[field_name] = item.get(field_name)
    return composite  # type: ignore[return-value]


def _ingredient_row(
    item: dict, ingredient: dict, food_by_slug: dict[str, Food], next_id: int
) -> CompositeIngredient:
    """One ingredient row. Ingredients with no food_slug (added water) get no plant_id."""
    slug = ingredient.get("food_slug")
    return {
        "id": next_id,
        "composite_id": item["id"],
        "plant_id": food_by_slug[slug]["id"] if slug else None,
        "label": slug or ingredient["label"],
        "fraction": ingredient["fraction"],
        "base_kg_per_kg": ingredient.get("base_kg_per_kg"),
    }
