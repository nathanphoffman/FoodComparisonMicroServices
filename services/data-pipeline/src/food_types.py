"""
types.py — raw data interfaces for the pipeline.
Port of packages/data-pipeline/src/types.ts (originally lib/types.ts).
These are TypedDicts so they map cleanly to/from JSON without extra parsing.
"""

from typing import TypedDict, Literal, Optional


class SourcedNumber(TypedDict):
    value: float
    source_id: int
    confidence: int


class NutritionValue(TypedDict):
    calories: float
    fat: float
    sat_fat: float
    protein: float
    fiber: float
    sodium: Optional[float]
    carbs: Optional[float]
    sugar: Optional[float]
    cholesterol: Optional[float]
    trans_fat: Optional[float]


class SourcedNutrition(TypedDict):
    value: NutritionValue
    source_id: int
    confidence: int


class Food(TypedDict):
    id: int
    slug: str
    name: str
    type: Literal["plant", "animal"]
    nutrition: list[SourcedNutrition]
    human_food: Literal[0, 1]
    tags: list[str]


class Animal(TypedDict):
    id: int
    food_id: int
    neuron_count: Optional[list[SourcedNumber]]
    weight_kg: Optional[list[SourcedNumber]]
    bycatch_animal_id: Optional[int]
    bycatch_amount: Optional[list[SourcedNumber]]
    yield_fraction: Optional[list[SourcedNumber]]
    pasture_ha_per_kg_output: Optional[list[SourcedNumber]]
    pasture_green_water_l_per_ha: Optional[list[SourcedNumber]]
    native_fraction: Optional[list[SourcedNumber]]
    ch4_kg_per_kg_output: Optional[list[SourcedNumber]]
    n2o_kg_per_kg_output: Optional[list[SourcedNumber]]
    co2_kg_per_kg_output: Optional[list[SourcedNumber]]


class Plant(TypedDict):
    id: int
    food_id: int
    yield_kg_ha: Optional[list[SourcedNumber]]
    yield_fraction: Optional[list[SourcedNumber]]
    water_per_kg: Optional[list[SourcedNumber]]
    green_water_per_kg: Optional[list[SourcedNumber]]
    blue_water_per_kg: Optional[list[SourcedNumber]]
    grey_water_per_kg: Optional[list[SourcedNumber]]
    soil_erosion: Optional[list[SourcedNumber]]
    pesticide_kg_ha: Optional[list[SourcedNumber]]
    fertilizer_kg_ha: Optional[list[SourcedNumber]]
    emissions_per_kg: Optional[list[SourcedNumber]]
    tillage_events_per_year: Optional[list[SourcedNumber]]
    co2_capture_kg_ha_yr: Optional[list[SourcedNumber]]


class Source(TypedDict):
    id: int
    url: str
    title: str
    notes: Optional[list[str]]


class AnimalFeed(TypedDict):
    id: int
    animal_id: int
    plant_id: int
    kg_feed_per_kg_output: list[SourcedNumber]


class PlantAnimalKill(TypedDict):
    id: int
    plant_id: int
    animal_id: int
    kills_per_ha: Optional[list[SourcedNumber]]


class Pesticide(TypedDict):
    id: int
    name: str
    freshwater_paf: list[SourcedNumber]
    terrestrial_paf: Optional[list[SourcedNumber]]
    insect_paf: Optional[list[SourcedNumber]]
    bee_ld50: Optional[list[SourcedNumber]]


class PlantPesticide(TypedDict):
    id: int
    plant_id: int
    pesticide_id: int
    kg_ha: Optional[list[SourcedNumber]]
