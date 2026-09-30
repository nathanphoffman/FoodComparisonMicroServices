"""
raw_plant.py — computation wrapper for a plant record.

Wraps a Plant TypedDict and exposes weighted averages and pesticide impact calculations
used when building the normalized database row for a plant food. The pesticide math
itself lives in pesticide_impact.py.
"""

from ...food_types import Plant
from .sourced_array import SourcedArray
from .pesticide_impact import (
    PesticideAssociation,
    bee_mortality_fraction,
    dose_scaled_affected_fraction,
    pesticide_kg_per_kg_food,
)

SQUARE_METERS_PER_HA = 10000


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
        # Wild fish killed to make this product (fishmeal, fish oil).
        self.wild_fish_kg_per_kg      = SourcedArray(data.get("wild_fish_kg_per_kg"))
        self.wild_fish_neuron_count   = SourcedArray(data.get("wild_fish_neuron_count"))
        self.wild_fish_weight_kg      = SourcedArray(data.get("wild_fish_weight_kg"))
        self.wild_fish_lifespan_years = SourcedArray(data.get("wild_fish_lifespan_years"))
        self._pesticide_associations = pesticide_associations

    @property
    def feed_emissions_per_kg(self) -> float | None:
        """Emissions charged when this crop is fed to animals: farm-gate if sourced,
        otherwise the (cradle-to-retail) food value."""
        return self.farm_gate_emissions_per_kg.weighted_average() or self.emissions_per_kg.weighted_average()

    @property
    def avg_pesticide_kg_per_kg_food(self) -> float | None:
        """Total pesticide kg applied per kg of food produced, weighted by yield."""
        return pesticide_kg_per_kg_food(self._pesticide_associations, self.yield_kg_ha.weighted_average())

    @property
    def pesticide_affected_freshwater_fraction(self) -> float | None:
        """Fraction of freshwater species affected by this crop's pesticide applications (0-1)."""
        return dose_scaled_affected_fraction(self._pesticide_associations, "avg_freshwater_paf")

    @property
    def pesticide_affected_terrestrial_fraction(self) -> float | None:
        """Fraction of soil species affected by this crop's pesticide applications (0-1)."""
        return dose_scaled_affected_fraction(self._pesticide_associations, "avg_terrestrial_paf")

    @property
    def pesticide_affected_insect_fraction(self) -> float | None:
        """Fraction of non-target insects affected by this crop's pesticide applications (0-1)."""
        return dose_scaled_affected_fraction(self._pesticide_associations, "avg_insect_paf")

    @property
    def pesticide_bee_mortality_fraction(self) -> float | None:
        """Fraction of foraging bees on this crop killed by its pesticide applications (0-1)."""
        return bee_mortality_fraction(self._pesticide_associations)

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
            SQUARE_METERS_PER_HA / average_yield_kg_per_ha if average_yield_kg_per_ha else None
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
            "pesticide_freshwater_paf":  self.pesticide_affected_freshwater_fraction,
            "pesticide_terrestrial_paf": self.pesticide_affected_terrestrial_fraction,
            "pesticide_insect_paf":      self.pesticide_affected_insect_fraction,
            "pesticide_bee_hazard":      self.pesticide_bee_mortality_fraction,
            "pesticide_kg_per_kg_food":  _per_cooked_kg(self.avg_pesticide_kg_per_kg_food, cooked_ratio),
            "land_m2_per_kg":            land_square_meters_per_kg,
            "wild_fish_kg_per_kg":       self.wild_fish_kg_per_kg.weighted_average(),
            "wild_fish_neuron_count":    self.wild_fish_neuron_count.weighted_average(),
            "wild_fish_weight_kg":       self.wild_fish_weight_kg.weighted_average(),
            "wild_fish_lifespan_years":  self.wild_fish_lifespan_years.weighted_average(),
        }


def _per_cooked_kg(value_per_dry_kg: float | None, cooked_ratio: float) -> float | None:
    """Converts a per-kg-dry metric to per-kg-cooked (1 kg dry → cooked_ratio kg cooked)."""
    return value_per_dry_kg / cooked_ratio if value_per_dry_kg is not None else None
