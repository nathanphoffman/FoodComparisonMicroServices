"""
food_normalized.py — the normalized database row, produced by insert_foods_normalized.py.

Port of IFoodNormalized.ts / FoodNormalized class. Each instance represents one row
in the foods_normalized table, holding pre-computed weighted averages ready for the API.
"""

import json
from typing import Literal
from dataclasses import dataclass


@dataclass
class FoodNormalized:
    food_id: int
    is_feed: Literal[0, 1]
    slug: str
    name: str
    type: Literal["plant", "animal"]
    tags: list[str]
    human_food: Literal[0, 1]
    # nutrition
    calories: float | None = None
    fat: float | None = None
    sat_fat: float | None = None
    protein: float | None = None
    fiber: float | None = None
    sodium: float | None = None
    carbs: float | None = None
    sugar: float | None = None
    cholesterol: float | None = None
    trans_fat: float | None = None
    # plant metrics
    yield_kg_ha: float | None = None
    water_per_kg: float | None = None
    green_water_per_kg: float | None = None
    blue_water_per_kg: float | None = None
    grey_water_per_kg: float | None = None
    soil_erosion: float | None = None
    pesticide_kg_ha: float | None = None
    fertilizer_kg_ha: float | None = None
    emissions_per_kg: float | None = None
    tillage_events_per_year: float | None = None
    co2_capture_kg_ha_yr: float | None = None
    pesticide_freshwater_paf: float | None = None
    pesticide_terrestrial_paf: float | None = None
    pesticide_insect_paf: float | None = None
    pesticide_bee_hazard: float | None = None
    pesticide_kg_per_kg_food: float | None = None
    land_m2_per_kg: float | None = None
    # animal metrics
    neuron_count: float | None = None
    weight_kg: float | None = None
    yield_fraction: float | None = None
    pasture_ha_per_kg_output: float | None = None
    pasture_green_water_l_per_ha: float | None = None
    native_fraction: float | None = None
    bycatch_amount: float | None = None
    ch4_kg_per_kg_output: float | None = None
    n2o_kg_per_kg_output: float | None = None
    co2_kg_per_kg_output: float | None = None

    def to_db_params(self) -> tuple[int | float | str | None, ...]:
        """Returns all fields as a flat tuple matching the INSERT SQL column order."""
        return (
            self.food_id, self.is_feed,
            self.slug, self.name, self.type,
            json.dumps(self.tags), self.human_food,
            self.calories, self.fat, self.sat_fat, self.protein, self.fiber,
            self.sodium, self.carbs, self.sugar, self.cholesterol, self.trans_fat,
            self.yield_kg_ha, self.water_per_kg,
            self.green_water_per_kg, self.blue_water_per_kg, self.grey_water_per_kg,
            self.soil_erosion, self.pesticide_kg_ha,
            self.fertilizer_kg_ha, self.emissions_per_kg,
            self.tillage_events_per_year, self.co2_capture_kg_ha_yr,
            self.pesticide_freshwater_paf, self.pesticide_terrestrial_paf,
            self.pesticide_insect_paf, self.pesticide_bee_hazard,
            self.pesticide_kg_per_kg_food, self.land_m2_per_kg,
            self.neuron_count, self.weight_kg, self.yield_fraction,
            self.pasture_ha_per_kg_output, self.pasture_green_water_l_per_ha,
            self.native_fraction, self.bycatch_amount,
            self.ch4_kg_per_kg_output, self.n2o_kg_per_kg_output, self.co2_kg_per_kg_output,
        )
