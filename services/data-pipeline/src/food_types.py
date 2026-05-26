"""
food_types.py — raw data interfaces for the pipeline.

Port of packages/data-pipeline/src/types.ts (originally lib/types.ts).
These are TypedDicts so they map cleanly to/from JSON without extra parsing.
"""

from typing import TypedDict, Literal


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
    sodium: float | None
    carbs: float | None
    sugar: float | None
    cholesterol: float | None
    trans_fat: float | None


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
    neuron_count: list[SourcedNumber] | None
    weight_kg: list[SourcedNumber] | None
    bycatch_animal_id: int | None
    bycatch_food_slug: str | None
    bycatch_amount: list[SourcedNumber] | None
    yield_fraction: list[SourcedNumber] | None
    pasture_ha_per_kg_output: list[SourcedNumber] | None
    pasture_green_water_l_per_ha: list[SourcedNumber] | None
    native_fraction: list[SourcedNumber] | None
    ch4_kg_per_kg_output: list[SourcedNumber] | None
    n2o_kg_per_kg_output: list[SourcedNumber] | None
    co2_kg_per_kg_output: list[SourcedNumber] | None


class Plant(TypedDict):
    id: int
    food_id: int
    yield_kg_ha: list[SourcedNumber] | None
    yield_fraction: list[SourcedNumber] | None
    water_per_kg: list[SourcedNumber] | None
    green_water_per_kg: list[SourcedNumber] | None
    blue_water_per_kg: list[SourcedNumber] | None
    grey_water_per_kg: list[SourcedNumber] | None
    soil_erosion: list[SourcedNumber] | None
    pesticide_kg_ha: list[SourcedNumber] | None
    fertilizer_kg_ha: list[SourcedNumber] | None
    emissions_per_kg: list[SourcedNumber] | None
    tillage_events_per_year: list[SourcedNumber] | None
    co2_capture_kg_ha_yr: list[SourcedNumber] | None


class Source(TypedDict):
    id: int
    url: str
    title: str
    notes: list[str] | None


class AnimalFeed(TypedDict):
    id: int
    animal_id: int
    plant_id: int
    kg_feed_per_kg_output: list[SourcedNumber]


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
