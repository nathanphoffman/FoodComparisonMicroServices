"""
raw_food.py — top-level computation wrapper that combines food, plant, and animal data.

Produces two FoodNormalized rows per animal food:
  - to_normalized()      — the food itself (nutrition + plant or animal metrics)
  - to_feed_normalized() — the environmental footprint of the feed crops (animals only)
"""

from typing import TYPE_CHECKING

from ...food_types import Food
from .sourced_array import SourcedNutritionArray
from .food_normalized import FoodNormalized

if TYPE_CHECKING:
    from .raw_plant import RawPlant
    from .raw_animal import RawAnimal

# Null-out dicts for foods that have no plant or no animal record.
# yield_fraction is intentionally absent from both: it is supplied by whichever
# side is present (plant or animal), and FoodNormalized defaults it to None otherwise.
_NULL_PLANT_FIELDS = dict(
    yield_kg_ha=None,
    water_per_kg=None,
    green_water_per_kg=None, blue_water_per_kg=None, grey_water_per_kg=None,
    soil_erosion=None, pesticide_kg_ha=None, fertilizer_kg_ha=None,
    emissions_per_kg=None, tillage_events_per_year=None, co2_capture_kg_ha_yr=None,
    pesticide_freshwater_paf=None, pesticide_terrestrial_paf=None,
    pesticide_insect_paf=None, pesticide_bee_hazard=None,
    pesticide_kg_per_kg_food=None, land_m2_per_kg=None,
)
_NULL_ANIMAL_FIELDS = dict(
    neuron_count=None, weight_kg=None,
    pasture_ha_per_kg_output=None, pasture_green_water_l_per_ha=None,
    native_fraction=None, bycatch_amount=None,
    ch4_kg_per_kg_output=None, n2o_kg_per_kg_output=None, co2_kg_per_kg_output=None,
)


class RawFood:
    """Combines a food record with its optional plant and animal data for normalization."""

    def __init__(
        self,
        data: Food,
        plant: "RawPlant | None",
        animal: "RawAnimal | None",
    ) -> None:
        self._data = data
        self._plant = plant
        self._animal = animal
        self.nutrition = SourcedNutritionArray(data["nutrition"])

    def to_normalized(self) -> FoodNormalized:
        """Builds the primary normalized row for this food."""
        nutrition_average = self.nutrition.weighted_average()
        return FoodNormalized(
            food_id=self._data["id"],
            is_feed=0,
            slug=self._data["slug"],
            name=self._data["name"],
            type=self._data["type"],
            tags=self._data["tags"],
            human_food=self._data["human_food"],
            calories=nutrition_average["calories"] if nutrition_average else None,
            fat=nutrition_average["fat"] if nutrition_average else None,
            sat_fat=nutrition_average["sat_fat"] if nutrition_average else None,
            protein=nutrition_average["protein"] if nutrition_average else None,
            fiber=nutrition_average["fiber"] if nutrition_average else None,
            sodium=nutrition_average.get("sodium") if nutrition_average else None,
            carbs=nutrition_average.get("carbs") if nutrition_average else None,
            sugar=nutrition_average.get("sugar") if nutrition_average else None,
            cholesterol=nutrition_average.get("cholesterol") if nutrition_average else None,
            trans_fat=nutrition_average.get("trans_fat") if nutrition_average else None,
            **(self._plant.normalized_fields() if self._plant else _NULL_PLANT_FIELDS),
            **(self._animal.normalized_fields() if self._animal else _NULL_ANIMAL_FIELDS),
        )

    def to_feed_normalized(self) -> FoodNormalized | None:
        """Builds the feed-impact normalized row for this food, or None if not an animal."""
        if not self._animal:
            return None
        feed_fields = self._animal.feed_normalized_fields()
        if not feed_fields:
            return None
        return FoodNormalized(
            food_id=self._data["id"],
            is_feed=1,
            slug=f"{self._data['slug']}-feed",
            name=f"{self._data['name']} (Feed)",
            type=self._data["type"],
            tags=self._data["tags"],
            human_food=self._data["human_food"],
            calories=None, fat=None, sat_fat=None, protein=None, fiber=None,
            sodium=None, carbs=None, sugar=None, cholesterol=None, trans_fat=None,
            **feed_fields,
            **_NULL_ANIMAL_FIELDS,
        )
