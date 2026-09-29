"""
validate.py — shared validation helpers for insert functions.

Raises descriptive errors when required sourced arrays are absent,
so that data integrity problems are caught before they reach SQLite.
"""


def assert_sourced_array(value: list | None, label: str) -> None:
    """Raises ValueError if a required sourced array is None or empty."""
    if not value:
        raise ValueError(f"{label} must be a non-empty sourced array, got: {value!r}")


LAND_TYPE_KEYS = {
    "tropical_forest", "tropical_savanna", "temperate_grassland",
    "temperate_forest", "dry", "wetland",
}


def assert_land_types(value: dict | None, label: str) -> None:
    """Raises ValueError if a land_types split has unknown keys or doesn't sum to 1."""
    if value is None:
        return
    unknown = set(value) - LAND_TYPE_KEYS
    if unknown:
        raise ValueError(f"{label} has unknown land types: {sorted(unknown)}")
    total = sum(value.values())
    if abs(total - 1.0) > 0.01:
        raise ValueError(f"{label} fractions must sum to 1, got {total:.3f}")


def assert_composite_ingredients(item: dict, food_by_slug: dict, plant_ids: set[int]) -> None:
    """Raises ValueError if a composite's ingredients reference unknown or non-plant foods,
    or their weight fractions don't sum to 1."""
    slug = item.get("slug")
    ingredients = item.get("ingredients") or []
    if not ingredients:
        raise ValueError(f"{slug}.ingredients must be a non-empty list")
    total = 0.0
    for ingredient in ingredients:
        ingredient_slug = ingredient.get("food_slug")
        if ingredient_slug is None:
            if not ingredient.get("label"):
                raise ValueError(f"{slug}: an ingredient with no food_slug needs a label (e.g. 'water')")
        elif ingredient_slug not in food_by_slug:
            raise ValueError(f"{slug}: unknown ingredient food_slug {ingredient_slug!r}")
        elif food_by_slug[ingredient_slug]["id"] not in plant_ids:
            raise ValueError(f"{slug}: ingredient {ingredient_slug!r} must be a plant food")
        assert_sourced_array(ingredient.get("fraction"), f"{slug}.ingredients[{ingredient_slug or ingredient.get('label')}].fraction")
        total += _mean_value(ingredient["fraction"])
    if abs(total - 1.0) > 0.02:
        raise ValueError(f"{slug}.ingredients fractions must sum to 1, got {total:.3f}")


def _mean_value(sourced_array: list[dict]) -> float:
    """Plain mean of a sourced array's values (only used for sanity checks)."""
    return sum(item["value"] for item in sourced_array) / len(sourced_array)
