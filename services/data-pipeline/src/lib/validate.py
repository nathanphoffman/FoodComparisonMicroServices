"""
validate.py — shared validation helpers for insert functions.

Raises descriptive errors when required sourced arrays are absent,
so that data integrity problems are caught before they reach SQLite.
"""


def assert_sourced_array(value: list | None, label: str) -> None:
    """Raises ValueError if a required sourced array is None or empty."""
    if not value:
        raise ValueError(f"{label} must be a non-empty sourced array, got: {value!r}")
