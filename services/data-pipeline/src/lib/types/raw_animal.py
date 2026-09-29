"""
raw_animal.py — computation wrapper for an animal record.

Wraps an Animal TypedDict and exposes two sets of normalized fields:
  - normalized_fields()      — the animal's own metrics (neurons, weight, emissions, etc.)
  - feed_normalized_fields() — environmental impact of the feed crops the animal consumes

Feed impacts are computed by summing each plant feed source's environmental metrics,
scaled by the kg of that feed required to produce 1 kg of animal output.
"""

from typing import TYPE_CHECKING

from ...food_types import Animal
from .sourced_array import SourcedArray
from .crop_mix import (
    CropShare,
    compute_land_use_square_meters_per_kg,
    compute_per_yield_impacts,
    compute_pesticide_paf_impacts,
    compute_water_and_emissions,
    compute_wild_fish,
)

if TYPE_CHECKING:
    from .raw_plant import RawPlant
    from .raw_animal_feed import RawAnimalFeed


class FeedEntry(CropShare):
    """Pairs a feed ratio record with its corresponding plant metrics."""

    def __init__(self, feed: "RawAnimalFeed", plant: "RawPlant") -> None:
        super().__init__(feed.kg_feed_per_kg_output.weighted_average(), plant)
        self.feed = feed


class RawAnimal:
    """Wraps an Animal record and exposes weighted averages for all animal metrics."""

    def __init__(self, data: Animal, feed_entries: list[FeedEntry]) -> None:
        self.neuron_count                 = SourcedArray(data.get("neuron_count"))
        self.weight_kg                    = SourcedArray(data.get("weight_kg"))
        self.lifetime_output_kg           = SourcedArray(data.get("lifetime_output_kg"))
        self.offspring_deaths_per_animal  = SourcedArray(data.get("offspring_deaths_per_animal"))
        self.offspring_captivity_years    = SourcedArray(data.get("offspring_captivity_years"))
        self.yield_fraction               = SourcedArray(data.get("yield_fraction"))
        self.pasture_ha_per_kg_output     = SourcedArray(data.get("pasture_ha_per_kg_output"))
        self.pasture_green_water_l_per_ha = SourcedArray(data.get("pasture_green_water_l_per_ha"))
        self.native_fraction              = SourcedArray(data.get("native_fraction"))
        self.bycatch_amount               = SourcedArray(data.get("bycatch_amount"))
        self.bycatch_food_slug: str | None = data.get("bycatch_food_slug")
        self.ch4_kg_per_kg_output         = SourcedArray(data.get("ch4_kg_per_kg_output"))
        self.n2o_kg_per_kg_output         = SourcedArray(data.get("n2o_kg_per_kg_output"))
        self.co2_kg_per_kg_output         = SourcedArray(data.get("co2_kg_per_kg_output"))
        self._feed_entries                = feed_entries

    def normalized_fields(self) -> dict[str, float | str | None]:
        """Returns all animal metrics as a flat dict for FoodNormalized."""
        return {
            "neuron_count":                  self.neuron_count.weighted_average(),
            "weight_kg":                     self.weight_kg.weighted_average(),
            "lifetime_output_kg":            self.lifetime_output_kg.weighted_average(),
            "offspring_deaths_per_animal":   self.offspring_deaths_per_animal.weighted_average(),
            "offspring_captivity_years":     self.offspring_captivity_years.weighted_average(),
            "yield_fraction":                self.yield_fraction.weighted_average(),
            "pasture_ha_per_kg_output":      self.pasture_ha_per_kg_output.weighted_average(),
            "pasture_green_water_l_per_ha":  self.pasture_green_water_l_per_ha.weighted_average(),
            "native_fraction":               self.native_fraction.weighted_average(),
            "bycatch_amount":                self.bycatch_amount.weighted_average(),
            "bycatch_food_slug":             self.bycatch_food_slug,
            "ch4_kg_per_kg_output":          self.ch4_kg_per_kg_output.weighted_average(),
            "n2o_kg_per_kg_output":          self.n2o_kg_per_kg_output.weighted_average(),
            "co2_kg_per_kg_output":          self.co2_kg_per_kg_output.weighted_average(),
            **compute_wild_fish(self._feed_entries),
        }

    def feed_normalized_fields(self) -> dict[str, float | None] | None:
        """Computes feed-crop environmental impact metrics aggregated across all feed sources."""
        if not self._feed_entries:
            return None

        pasture_hectares_per_kg = self.pasture_ha_per_kg_output.weighted_average() or 0
        pasture_evaporation_liters_per_ha = self.pasture_green_water_l_per_ha.weighted_average() or 0
        pasture_baseline_water = pasture_hectares_per_kg * pasture_evaporation_liters_per_ha

        land_square_meters = compute_land_use_square_meters_per_kg(self._feed_entries)
        emissions, green_water, blue_water, grey_water = compute_water_and_emissions(
            self._feed_entries, pasture_baseline=pasture_baseline_water
        )
        soil_erosion, fertilizer, tillage, carbon_capture = compute_per_yield_impacts(
            self._feed_entries
        )
        (
            pesticide_kg_per_kg,
            freshwater_paf,
            terrestrial_paf,
            insect_paf,
            bee_hazard,
        ) = compute_pesticide_paf_impacts(self._feed_entries)

        return {
            "yield_kg_ha":               None,
            "yield_fraction":            None,
            "land_m2_per_kg":            land_square_meters or None,
            "water_per_kg":              (green_water + blue_water) or None,
            "green_water_per_kg":        green_water or None,
            "blue_water_per_kg":         blue_water or None,
            "grey_water_per_kg":         grey_water or None,
            "soil_erosion":              soil_erosion or None,
            "pesticide_kg_ha":           None,
            "fertilizer_kg_ha":          fertilizer or None,
            "emissions_per_kg":          emissions or None,
            "tillage_events_per_year":   tillage or None,
            "co2_capture_kg_ha_yr":      carbon_capture or None,
            "pesticide_freshwater_paf":  freshwater_paf,
            "pesticide_terrestrial_paf": terrestrial_paf,
            "pesticide_insect_paf":      insect_paf,
            "pesticide_bee_hazard":      bee_hazard,
            "pesticide_kg_per_kg_food":  pesticide_kg_per_kg or None,
        }
