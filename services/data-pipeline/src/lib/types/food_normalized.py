"""
food_normalized.py — the normalized DB row, produced by insert_foods_normalized.py.
Port of IFoodNormalized.ts / FoodNormalized class.
"""

from typing import Optional, Literal
from dataclasses import dataclass, field


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
    calories: Optional[float] = None
    fat: Optional[float] = None
    sat_fat: Optional[float] = None
    protein: Optional[float] = None
    fiber: Optional[float] = None
    sodium: Optional[float] = None
    carbs: Optional[float] = None
    sugar: Optional[float] = None
    cholesterol: Optional[float] = None
    trans_fat: Optional[float] = None
    # plant metrics
    yield_kg_ha: Optional[float] = None
    water_per_kg: Optional[float] = None
    green_water_per_kg: Optional[float] = None
    blue_water_per_kg: Optional[float] = None
    grey_water_per_kg: Optional[float] = None
    soil_erosion: Optional[float] = None
    pesticide_kg_ha: Optional[float] = None
    fertilizer_kg_ha: Optional[float] = None
    emissions_per_kg: Optional[float] = None
    tillage_events_per_year: Optional[float] = None
    co2_capture_kg_ha_yr: Optional[float] = None
    pesticide_freshwater_paf: Optional[float] = None
    pesticide_terrestrial_paf: Optional[float] = None
    pesticide_insect_paf: Optional[float] = None
    pesticide_bee_hazard: Optional[float] = None
    pesticide_kg_per_kg_food: Optional[float] = None
    land_m2_per_kg: Optional[float] = None
    # animal metrics
    neuron_count: Optional[float] = None
    weight_kg: Optional[float] = None
    yield_fraction: Optional[float] = None
    pasture_ha_per_kg_output: Optional[float] = None
    pasture_green_water_l_per_ha: Optional[float] = None
    native_fraction: Optional[float] = None
    bycatch_amount: Optional[float] = None
    ch4_kg_per_kg_output: Optional[float] = None
    n2o_kg_per_kg_output: Optional[float] = None
    co2_kg_per_kg_output: Optional[float] = None

    def to_db_params(self) -> tuple:
        import json
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
