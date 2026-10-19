"""
impacts.py — pesticides and the plant kills and pesticide use tied to foods.

TypedDicts, so they map cleanly to/from JSON without extra parsing.
"""

from typing import TypedDict
from .shared import SourcedNumber


class PlantAnimalKill(TypedDict):
    id: int
    plant_id: int
    animal_id: int
    kills_per_ha: list[SourcedNumber] | None


class Pesticide(TypedDict):
    id: int
    name: str
    freshwater_paf: list[SourcedNumber]
    terrestrial_paf: list[SourcedNumber] | None
    insect_paf: list[SourcedNumber] | None
    bee_ld50: list[SourcedNumber] | None


class PlantPesticide(TypedDict):
    id: int
    plant_id: int
    pesticide_id: int
    kg_ha: list[SourcedNumber] | None
