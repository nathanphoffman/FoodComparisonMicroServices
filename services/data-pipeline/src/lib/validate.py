from typing import Optional


def assert_sourced_array(value: Optional[list], label: str) -> None:
    """Raises if a required sourced array is None or empty."""
    if not value:
        raise ValueError(f"{label} must be a non-empty sourced array, got: {value!r}")
