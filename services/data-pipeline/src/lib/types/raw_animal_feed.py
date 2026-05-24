"""
raw_animal_feed.py — computation wrapper for an animal feed association record.

Wraps an AnimalFeed TypedDict and exposes the kg_feed_per_kg_output sourced array
as a SourcedArray for weighted averaging during the normalized database build.
"""

from ...food_types import AnimalFeed
from .sourced_array import SourcedArray


class RawAnimalFeed:
    """Wraps an AnimalFeed record and exposes its sourced array for weighted averaging."""

    def __init__(self, data: AnimalFeed) -> None:
        self.animal_id = data["animal_id"]
        self.plant_id = data["plant_id"]
        self.kg_feed_per_kg_output = SourcedArray(data["kg_feed_per_kg_output"])
