from typing import Optional, TYPE_CHECKING
from ...food_types import Food
from .sourced_array import SourcedNutritionArray
from .food_normalized import FoodNormalized

if TYPE_CHECKING:
    from .raw_plant import RawPlant
    from .raw_animal import RawAnimal

_NULL_PLANT = dict(
    yield_kg_ha=None,
    # yield_fraction omitted: animals supply it via _animal.normalized_fields()
    # and FoodNormalized defaults it to None for plant-less rows
    water_per_kg=None,
    green_water_per_kg=None, blue_water_per_kg=None, grey_water_per_kg=None,
    soil_erosion=None, pesticide_kg_ha=None, fertilizer_kg_ha=None,
    emissions_per_kg=None, tillage_events_per_year=None, co2_capture_kg_ha_yr=None,
    pesticide_freshwater_paf=None, pesticide_terrestrial_paf=None,
    pesticide_insect_paf=None, pesticide_bee_hazard=None,
    pesticide_kg_per_kg_food=None, land_m2_per_kg=None,
)
_NULL_ANIMAL = dict(
    neuron_count=None, weight_kg=None,
    # yield_fraction omitted: plants supply it via _plant.normalized_fields()
    # and FoodNormalized defaults it to None for animal-less rows
    pasture_ha_per_kg_output=None, pasture_green_water_l_per_ha=None,
    native_fraction=None, bycatch_amount=None,
    ch4_kg_per_kg_output=None, n2o_kg_per_kg_output=None, co2_kg_per_kg_output=None,
)


class RawFood:
    def __init__(self, data: Food, plant: Optional["RawPlant"], animal: Optional["RawAnimal"]) -> None:
        self._data = data
        self._plant = plant
        self._animal = animal
        self.nutrition = SourcedNutritionArray(data["nutrition"])

    def to_normalized(self) -> FoodNormalized:
        n = self.nutrition.weighted_average()
        return FoodNormalized(
            food_id=self._data["id"],
            is_feed=0,
            slug=self._data["slug"],
            name=self._data["name"],
            type=self._data["type"],
            tags=self._data["tags"],
            human_food=self._data["human_food"],
            calories=n["calories"] if n else None,
            fat=n["fat"] if n else None,
            sat_fat=n["sat_fat"] if n else None,
            protein=n["protein"] if n else None,
            fiber=n["fiber"] if n else None,
            sodium=n.get("sodium") if n else None,
            carbs=n.get("carbs") if n else None,
            sugar=n.get("sugar") if n else None,
            cholesterol=n.get("cholesterol") if n else None,
            trans_fat=n.get("trans_fat") if n else None,
            **(self._plant.normalized_fields() if self._plant else _NULL_PLANT),
            **(self._animal.normalized_fields() if self._animal else _NULL_ANIMAL),
        )

    def to_feed_normalized(self) -> Optional[FoodNormalized]:
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
            **_NULL_ANIMAL,
        )
