"""
food_types.py — raw data interfaces for the pipeline.

Port of packages/data-pipeline/src/types.ts (originally lib/types.ts).
These are TypedDicts so they map cleanly to/from JSON without extra parsing.
"""

from typing import TypedDict, Literal, NotRequired


class SourcedNumber(TypedDict):
    value: float
    source_id: int
    confidence: int
    region: NotRequired[Literal["US", "world"]]  # optional; untagged values count as world


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
    availability_gg: list[SourcedNumber] | None
    sentient_harm_explanation: NotRequired[str | None]
    # plain-English summary of how this food's numbers were derived and any quirks; see data/json/SCHEMA.md
    notes: NotRequired[str | None]
    # fraction of this food's land in each broad land type (sums to 1); see data/json/SCHEMA.md
    land_types: NotRequired[dict[str, float] | None]
    # which foods/<category>.json file the food lives in (e.g. "nuts", "leafy")
    category: NotRequired[str]


class Animal(TypedDict):
    id: int
    food_id: int
    neuron_count: list[SourcedNumber] | None
    weight_kg: list[SourcedNumber] | None
    lifetime_output_kg: list[SourcedNumber] | None
    offspring_deaths_per_animal: list[SourcedNumber] | None
    offspring_captivity_years: list[SourcedNumber] | None
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
    farm_gate_emissions_per_kg: NotRequired[list[SourcedNumber] | None]
    tillage_events_per_year: list[SourcedNumber] | None
    co2_capture_kg_ha_yr: list[SourcedNumber] | None
    cooked_weight_ratio: list[SourcedNumber] | None
    # Wild fish killed to make this product (fishmeal, fish oil); absent otherwise.
    wild_fish_kg_per_kg: NotRequired[list[SourcedNumber] | None]
    wild_fish_neuron_count: NotRequired[list[SourcedNumber] | None]
    wild_fish_weight_kg: NotRequired[list[SourcedNumber] | None]
    wild_fish_lifespan_years: NotRequired[list[SourcedNumber] | None]


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


class Composite(TypedDict):
    """A food made from other foods (e.g. a plant-based burger); see data/json/SCHEMA.md."""
    id: int
    food_id: int
    processing_emissions_per_kg: list[SourcedNumber] | None
    processing_water_per_kg: list[SourcedNumber] | None


class CompositeIngredient(TypedDict):
    id: int
    composite_id: int
    plant_id: int | None  # None for ingredients with no crop footprint (added water)
    label: str            # the ingredient food's slug, or a name like "water"
    fraction: list[SourcedNumber]              # kg of ingredient per kg of product
    base_kg_per_kg: list[SourcedNumber] | None  # kg of base food per kg of ingredient (default 1)


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
