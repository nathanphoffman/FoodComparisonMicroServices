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
        self.farm_gate_emissions_per_kg = SourcedArray(data.get("farm_gate_emissions_per_kg"))
        self.tillage_events_per_year = SourcedArray(data.get("tillage_events_per_year"))
        self.co2_capture_kg_ha_yr    = SourcedArray(data.get("co2_capture_kg_ha_yr"))
        self.cooked_weight_ratio     = SourcedArray(data.get("cooked_weight_ratio"))
        self._pesticide_associations = pesticide_associations

    @property
    def feed_emissions_per_kg(self) -> float | None:
        """Emissions charged when this crop is fed to animals: farm-gate if sourced,
        otherwise the (cradle-to-retail) food value."""
        return self.farm_gate_emissions_per_kg.weighted_average() or self.emissions_per_kg.weighted_average()

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
        """Returns all plant environmental metrics as a flat dict for FoodNormalized.

        Foods eaten cooked (e.g. dry beans) have nutrition per kg of cooked food, while
        yield / water / emissions are sourced per kg of dry harvest. When a
        cooked_weight_ratio (kg cooked per kg dry) is present, the per-kg metrics are
        converted to a cooked-weight basis so both sides match. Feed calculations use the
        raw dry-basis arrays directly and are unaffected.
        """
        cooked_ratio = self.cooked_weight_ratio.weighted_average() or 1.0
        dry_yield_kg_per_ha = self.yield_kg_ha.weighted_average()
        average_yield_kg_per_ha = (
            dry_yield_kg_per_ha * cooked_ratio if dry_yield_kg_per_ha else dry_yield_kg_per_ha
        )
        land_square_meters_per_kg = (
            10000 / average_yield_kg_per_ha if average_yield_kg_per_ha else None
        )
        return {
            "yield_kg_ha":               average_yield_kg_per_ha,
            "yield_fraction":            self.yield_fraction.weighted_average(),
            "water_per_kg":              _per_cooked_kg(self.water_per_kg.weighted_average(), cooked_ratio),
            "green_water_per_kg":        _per_cooked_kg(self.green_water_per_kg.weighted_average(), cooked_ratio),
            "blue_water_per_kg":         _per_cooked_kg(self.blue_water_per_kg.weighted_average(), cooked_ratio),
            "grey_water_per_kg":         _per_cooked_kg(self.grey_water_per_kg.weighted_average(), cooked_ratio),
            "soil_erosion":              self.soil_erosion.weighted_average(),
            "pesticide_kg_ha":           self.pesticide_kg_ha.weighted_average(),
            "fertilizer_kg_ha":          self.fertilizer_kg_ha.weighted_average(),
            "emissions_per_kg":          _per_cooked_kg(self.emissions_per_kg.weighted_average(), cooked_ratio),
            "tillage_events_per_year":   self.tillage_events_per_year.weighted_average(),
            "co2_capture_kg_ha_yr":      self.co2_capture_kg_ha_yr.weighted_average(),
            "pesticide_freshwater_paf":  self.avg_pesticide_weighted_freshwater_paf,
            "pesticide_terrestrial_paf": self.avg_pesticide_weighted_terrestrial_paf,
            "pesticide_insect_paf":      self.avg_pesticide_weighted_insect_paf,
            "pesticide_bee_hazard":      self.avg_pesticide_weighted_bee_hazard,
            "pesticide_kg_per_kg_food":  _per_cooked_kg(self.avg_pesticide_kg_per_kg_food, cooked_ratio),
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


def _per_cooked_kg(value_per_dry_kg: float | None, cooked_ratio: float) -> float | None:
    """Converts a per-kg-dry metric to per-kg-cooked (1 kg dry → cooked_ratio kg cooked)."""
    return value_per_dry_kg / cooked_ratio if value_per_dry_kg is not None else None
