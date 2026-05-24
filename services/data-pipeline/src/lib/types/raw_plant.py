"""
raw_plant.py — computation wrapper for a plant record.

Wraps a Plant TypedDict and exposes weighted averages and pesticide impact calculations
used when building the normalized database row for a plant food.

PAF = Potentially Affected Fraction of species, a measure of ecotoxicity.
"""

from ...food_types import Plant
from .sourced_array import SourcedArray
from .raw_pesticide import RawPesticide
from .raw_plant_pesticide import RawPlantPesticide


# Average mass of a honeybee in kilograms, used to convert LD50 to a per-bee hazard score.
BEE_WEIGHT_KG = 1e-4


class PesticideAssociation:
    """Pairs a plant's pesticide usage record with its full pesticide data."""

    def __init__(self, plant_pesticide: RawPlantPesticide, pesticide: RawPesticide) -> None:
        self.plant_pesticide = plant_pesticide
        self.pesticide = pesticide


class RawPlant:
    """Wraps a Plant record and exposes weighted averages for all environmental metrics."""

    def __init__(self, data: Plant, pesticide_associations: list[PesticideAssociation]) -> None:
        self.id = data["id"]
        self.yield_kg_ha             = SourcedArray(data.get("yield_kg_ha"))
        self.yield_fraction          = SourcedArray(data.get("yield_fraction"))
        self.water_per_kg            = SourcedArray(data.get("water_per_kg"))
        self.green_water_per_kg      = SourcedArray(data.get("green_water_per_kg"))
        self.blue_water_per_kg       = SourcedArray(data.get("blue_water_per_kg"))
        self.grey_water_per_kg       = SourcedArray(data.get("grey_water_per_kg"))
        self.soil_erosion            = SourcedArray(data.get("soil_erosion"))
        self.pesticide_kg_ha         = SourcedArray(data.get("pesticide_kg_ha"))
        self.fertilizer_kg_ha        = SourcedArray(data.get("fertilizer_kg_ha"))
        self.emissions_per_kg        = SourcedArray(data.get("emissions_per_kg"))
        self.tillage_events_per_year = SourcedArray(data.get("tillage_events_per_year"))
        self.co2_capture_kg_ha_yr    = SourcedArray(data.get("co2_capture_kg_ha_yr"))
        self._pesticide_associations = pesticide_associations

    @property
    def avg_pesticide_kg_per_kg_food(self) -> float | None:
        """Total pesticide kg applied per kg of food produced, weighted by yield."""
        average_yield_kg_per_ha = self.yield_kg_ha.weighted_average()
        if average_yield_kg_per_ha is None or average_yield_kg_per_ha <= 0:
            return None
        total_pesticide_kg_per_kg = sum(
            kg_per_ha / average_yield_kg_per_ha
            for association in self._pesticide_associations
            if (kg_per_ha := association.plant_pesticide.kg_ha.weighted_average()) is not None
        )
        return total_pesticide_kg_per_kg or None

    @property
    def avg_pesticide_weighted_freshwater_paf(self) -> float | None:
        """Pesticide-kg-weighted average freshwater PAF across all applied pesticides."""
        return self._weighted_paf_by_pesticide_kg("avg_freshwater_paf")

    @property
    def avg_pesticide_weighted_terrestrial_paf(self) -> float | None:
        """Pesticide-kg-weighted average terrestrial PAF across all applied pesticides."""
        return self._weighted_paf_by_pesticide_kg("avg_terrestrial_paf")

    @property
    def avg_pesticide_weighted_insect_paf(self) -> float | None:
        """Pesticide-kg-weighted average insect PAF across all applied pesticides."""
        return self._weighted_paf_by_pesticide_kg("avg_insect_paf")

    @property
    def avg_pesticide_weighted_bee_hazard(self) -> float | None:
        """Pesticide-kg-weighted average bee hazard score across all applied pesticides."""
        numerator = 0.0
        denominator = 0.0
        for association in self._pesticide_associations:
            kg_per_ha = association.plant_pesticide.kg_ha.weighted_average()
            bee_ld50 = association.pesticide.avg_bee_ld50
            if kg_per_ha is not None and bee_ld50 is not None and bee_ld50 > 0:
                hazard_score = kg_per_ha / (bee_ld50 * BEE_WEIGHT_KG)
                numerator += kg_per_ha * hazard_score
                denominator += kg_per_ha
        return numerator / denominator if denominator > 0 else None

    def normalized_fields(self) -> dict[str, float | None]:
        """Returns all plant environmental metrics as a flat dict for FoodNormalized."""
        average_yield_kg_per_ha = self.yield_kg_ha.weighted_average()
        land_square_meters_per_kg = (
            10000 / average_yield_kg_per_ha if average_yield_kg_per_ha else None
        )
        return {
            "yield_kg_ha":               average_yield_kg_per_ha,
            "yield_fraction":            self.yield_fraction.weighted_average(),
            "water_per_kg":              self.water_per_kg.weighted_average(),
            "green_water_per_kg":        self.green_water_per_kg.weighted_average(),
            "blue_water_per_kg":         self.blue_water_per_kg.weighted_average(),
            "grey_water_per_kg":         self.grey_water_per_kg.weighted_average(),
            "soil_erosion":              self.soil_erosion.weighted_average(),
            "pesticide_kg_ha":           self.pesticide_kg_ha.weighted_average(),
            "fertilizer_kg_ha":          self.fertilizer_kg_ha.weighted_average(),
            "emissions_per_kg":          self.emissions_per_kg.weighted_average(),
            "tillage_events_per_year":   self.tillage_events_per_year.weighted_average(),
            "co2_capture_kg_ha_yr":      self.co2_capture_kg_ha_yr.weighted_average(),
            "pesticide_freshwater_paf":  self.avg_pesticide_weighted_freshwater_paf,
            "pesticide_terrestrial_paf": self.avg_pesticide_weighted_terrestrial_paf,
            "pesticide_insect_paf":      self.avg_pesticide_weighted_insect_paf,
            "pesticide_bee_hazard":      self.avg_pesticide_weighted_bee_hazard,
            "pesticide_kg_per_kg_food":  self.avg_pesticide_kg_per_kg_food,
            "land_m2_per_kg":            land_square_meters_per_kg,
        }

    def _weighted_paf_by_pesticide_kg(self, paf_attribute_name: str) -> float | None:
        """Returns kg-weighted average PAF for the given attribute across all pesticides."""
        numerator = 0.0
        denominator = 0.0
        for association in self._pesticide_associations:
            kg_per_ha = association.plant_pesticide.kg_ha.weighted_average()
            paf_value = getattr(association.pesticide, paf_attribute_name)
            if kg_per_ha is not None and paf_value is not None:
                numerator += kg_per_ha * paf_value
                denominator += kg_per_ha
        return numerator / denominator if denominator > 0 else None
