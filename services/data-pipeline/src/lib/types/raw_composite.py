"""
raw_composite.py — computation wrapper for a composite food (a food made from other foods).

A composite lists its ingredients as kg per kg of product. Its crop impacts (land,
water, emissions, pesticides …) are the sum of its ingredients' impacts — the same
math as an animal's feed (see crop_mix.py) — plus the composite's own processing
emissions and water. The result is a normal plant-style row, so the API and scoring
treat it like any other plant food.
"""

from ...food_types import Composite
from .crop_mix import (
    CropShare,
    compute_land_use_square_meters_per_kg,
    compute_per_yield_impacts,
    compute_pesticide_paf_impacts,
    compute_water_and_emissions,
    compute_wild_fish,
)
from .raw_plant import RawPlant
from .sourced_array import SourcedArray

SQUARE_METERS_PER_HA = 10000


class IngredientEntry(CropShare):
    """One ingredient: `fraction` kg per kg of product, made from `base_kg_per_kg` kg of
    its base food each. `ratio` (kg of base food per kg of product) drives the crop sums."""

    def __init__(
        self,
        fraction: float,
        base_kg_per_kg: float,
        plant: RawPlant,
        land_types: dict[str, float] | None,
        availability_gg: float | None,
    ) -> None:
        super().__init__(fraction * base_kg_per_kg, plant)
        self.fraction = fraction
        self.land_types = land_types
        self.availability_gg = availability_gg


class RawComposite:
    """Wraps a Composite record and its ingredients."""

    def __init__(self, data: Composite, ingredients: list[IngredientEntry]) -> None:
        self.processing_emissions_per_kg = SourcedArray(data.get("processing_emissions_per_kg"))
        self.processing_water_per_kg     = SourcedArray(data.get("processing_water_per_kg"))
        self._ingredients = ingredients

    def normalized_fields(self) -> dict[str, float | None]:
        """Returns plant-style metrics for FoodNormalized, per kg of product. Per-hectare
        fields (erosion, fertilizer …) are land-weighted averages over the ingredients."""
        land_square_meters = compute_land_use_square_meters_per_kg(self._ingredients)
        yield_kg_per_ha = SQUARE_METERS_PER_HA / land_square_meters if land_square_meters else None

        emissions, green_water, blue_water, grey_water = compute_water_and_emissions(self._ingredients)
        emissions += self.processing_emissions_per_kg.weighted_average() or 0.0
        blue_water += self.processing_water_per_kg.weighted_average() or 0.0

        soil_erosion, fertilizer, tillage, carbon_capture = compute_per_yield_impacts(self._ingredients)
        (
            pesticide_kg_per_kg,
            freshwater_paf,
            terrestrial_paf,
            insect_paf,
            bee_hazard,
        ) = compute_pesticide_paf_impacts(self._ingredients)

        def per_ha(value_per_kg: float) -> float | None:
            return value_per_kg * yield_kg_per_ha if value_per_kg and yield_kg_per_ha else None

        return {
            "yield_kg_ha":               yield_kg_per_ha,
            "yield_fraction":            1.0,
            "water_per_kg":              (green_water + blue_water + grey_water) or None,
            "green_water_per_kg":        green_water or None,
            "blue_water_per_kg":         blue_water or None,
            "grey_water_per_kg":         grey_water or None,
            "soil_erosion":              per_ha(soil_erosion),
            "pesticide_kg_ha":           per_ha(pesticide_kg_per_kg),
            "fertilizer_kg_ha":          per_ha(fertilizer),
            "emissions_per_kg":          emissions or None,
            "tillage_events_per_year":   per_ha(tillage),
            "co2_capture_kg_ha_yr":      per_ha(carbon_capture),
            "pesticide_freshwater_paf":  freshwater_paf,
            "pesticide_terrestrial_paf": terrestrial_paf,
            "pesticide_insect_paf":      insect_paf,
            "pesticide_bee_hazard":      bee_hazard,
            "pesticide_kg_per_kg_food":  pesticide_kg_per_kg or None,
            "land_m2_per_kg":            land_square_meters or None,
            **compute_wild_fish(self._ingredients),
        }

    def land_types(self) -> dict[str, float] | None:
        """Land-area-weighted mix of the ingredients' land type splits."""
        totals: dict[str, float] = {}
        total_area = 0.0
        for ingredient in self._ingredients:
            yield_kg_per_ha = ingredient.plant.yield_kg_ha.weighted_average()
            if not ingredient.land_types or not ingredient.ratio or not yield_kg_per_ha:
                continue
            area = ingredient.ratio / yield_kg_per_ha
            total_area += area
            for land_type, share in ingredient.land_types.items():
                totals[land_type] = totals.get(land_type, 0.0) + area * share
        if total_area <= 0:
            return None
        return {land_type: round(value / total_area, 4) for land_type, value in totals.items() if value > 0}

    def availability_gg(self, own_availability_gg: float | None) -> float | None:
        """Geometric mean of the product's own supply and its ingredients' supply.

        Ingredient supply is the fraction-weighted average of each ingredient's world
        supply (ingredients with no supply figure, like added water, are left out).
        A geometric mean because the two differ by orders of magnitude — a new product
        can be ~3 Gg while its soy is ~370,000 Gg; a plain mean would just be the soy.
        Falls back to whichever side exists.
        """
        weighted = [(i.fraction, i.availability_gg) for i in self._ingredients if i.availability_gg]
        total_fraction = sum(fraction for fraction, _ in weighted)
        ingredient_gg = (
            sum(fraction * gg for fraction, gg in weighted) / total_fraction if total_fraction else None
        )
        if own_availability_gg and ingredient_gg:
            return (own_availability_gg * ingredient_gg) ** 0.5
        return own_availability_gg or ingredient_gg
