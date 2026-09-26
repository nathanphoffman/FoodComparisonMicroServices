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
