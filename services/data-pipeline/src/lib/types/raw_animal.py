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

if TYPE_CHECKING:
    from .raw_plant import RawPlant
    from .raw_animal_feed import RawAnimalFeed


class FeedEntry:
    """Pairs a feed ratio record with its corresponding plant metrics."""

    def __init__(self, feed: "RawAnimalFeed", plant: "RawPlant") -> None:
        self.feed = feed
        self.plant = plant


class RawAnimal:
    """Wraps an Animal record and exposes weighted averages for all animal metrics."""

    def __init__(self, data: Animal, feed_entries: list[FeedEntry]) -> None:
        self.neuron_count                 = SourcedArray(data.get("neuron_count"))
        self.weight_kg                    = SourcedArray(data.get("weight_kg"))
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
            "yield_fraction":                self.yield_fraction.weighted_average(),
            "pasture_ha_per_kg_output":      self.pasture_ha_per_kg_output.weighted_average(),
            "pasture_green_water_l_per_ha":  self.pasture_green_water_l_per_ha.weighted_average(),
            "native_fraction":               self.native_fraction.weighted_average(),
            "bycatch_amount":                self.bycatch_amount.weighted_average(),
            "bycatch_food_slug":             self.bycatch_food_slug,
            "ch4_kg_per_kg_output":          self.ch4_kg_per_kg_output.weighted_average(),
            "n2o_kg_per_kg_output":          self.n2o_kg_per_kg_output.weighted_average(),
            "co2_kg_per_kg_output":          self.co2_kg_per_kg_output.weighted_average(),
        }

    def feed_normalized_fields(self) -> dict[str, float | None] | None:
        """Computes feed-crop environmental impact metrics aggregated across all feed sources."""
        if not self._feed_entries:
            return None

        pasture_hectares_per_kg = self.pasture_ha_per_kg_output.weighted_average() or 0
        pasture_evaporation_liters_per_ha = self.pasture_green_water_l_per_ha.weighted_average() or 0
        pasture_baseline_water = pasture_hectares_per_kg * pasture_evaporation_liters_per_ha

        land_square_meters = _compute_land_use_square_meters_per_kg(self._feed_entries)
        emissions, green_water, blue_water, grey_water = _compute_water_and_emissions(
            self._feed_entries, pasture_baseline=pasture_baseline_water
        )
        soil_erosion, fertilizer, tillage, carbon_capture = _compute_per_yield_impacts(
            self._feed_entries
        )
        (
            pesticide_kg_per_kg,
            freshwater_paf,
            terrestrial_paf,
            insect_paf,
            bee_hazard,
        ) = _compute_pesticide_paf_impacts(self._feed_entries)

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


def _compute_land_use_square_meters_per_kg(feed_entries: list[FeedEntry]) -> float:
    """Sums feed-crop land use across all feed sources, in m² per kg of animal output."""
    total_land_square_meters = 0.0
    for entry in feed_entries:
        feed_ratio = entry.feed.kg_feed_per_kg_output.weighted_average()
        if feed_ratio is None:
            continue
        average_yield_kg_per_ha = entry.plant.yield_kg_ha.weighted_average()
        if average_yield_kg_per_ha and average_yield_kg_per_ha > 0:
            total_land_square_meters += feed_ratio * 10000 / average_yield_kg_per_ha
    return total_land_square_meters


def _compute_water_and_emissions(
    feed_entries: list[FeedEntry],
    pasture_baseline: float,
) -> tuple[float, float, float, float]:
    """Returns (total_emissions, green_water, blue_water, grey_water) summed across feed sources.

    pasture_baseline is the pasture evapotranspiration in liters per kg of animal output
    (pasture_ha_per_kg_output × pasture_green_water_l_per_ha). It is a water metric and
    only seeds total_green_water. Emissions are in kg CO2-eq and must start at zero.
    """
    total_emissions = 0.0
    total_green_water = pasture_baseline  # liters of green water from pasture grazing itself
    total_blue_water = 0.0
    total_grey_water = 0.0
    for entry in feed_entries:
        feed_ratio = entry.feed.kg_feed_per_kg_output.weighted_average()
        if feed_ratio is None:
            continue
        plant_emissions = entry.plant.emissions_per_kg.weighted_average()
        if plant_emissions:
            total_emissions += feed_ratio * plant_emissions
        green_water = entry.plant.green_water_per_kg.weighted_average()
        blue_water = entry.plant.blue_water_per_kg.weighted_average()
        grey_water = entry.plant.grey_water_per_kg.weighted_average()
        total_water = entry.plant.water_per_kg.weighted_average()
        if green_water:
            total_green_water += feed_ratio * green_water
        if blue_water:
            total_blue_water += feed_ratio * blue_water
        if grey_water:
            total_grey_water += feed_ratio * grey_water
        if green_water is None and blue_water is None and total_water:
            total_green_water += feed_ratio * total_water
    return total_emissions, total_green_water, total_blue_water, total_grey_water


def _compute_per_yield_impacts(
    feed_entries: list[FeedEntry],
) -> tuple[float, float, float, float]:
    """Returns (soil_erosion, fertilizer, tillage, carbon_capture) summed across feed sources."""
    total_soil_erosion = 0.0
    total_fertilizer = 0.0
    total_tillage = 0.0
    total_carbon_capture = 0.0
    for entry in feed_entries:
        feed_ratio = entry.feed.kg_feed_per_kg_output.weighted_average()
        if feed_ratio is None:
            continue
        average_yield_kg_per_ha = entry.plant.yield_kg_ha.weighted_average()
        if not average_yield_kg_per_ha or average_yield_kg_per_ha <= 0:
            continue
        soil_erosion = entry.plant.soil_erosion.weighted_average()
        fertilizer = entry.plant.fertilizer_kg_ha.weighted_average()
        tillage = entry.plant.tillage_events_per_year.weighted_average()
        carbon_capture = entry.plant.co2_capture_kg_ha_yr.weighted_average()
        if soil_erosion:
            total_soil_erosion += feed_ratio * soil_erosion / average_yield_kg_per_ha
        if fertilizer:
            total_fertilizer += feed_ratio * fertilizer / average_yield_kg_per_ha
        if tillage:
            total_tillage += feed_ratio * tillage / average_yield_kg_per_ha
        if carbon_capture:
            total_carbon_capture += feed_ratio * carbon_capture / average_yield_kg_per_ha
    return total_soil_erosion, total_fertilizer, total_tillage, total_carbon_capture


def _compute_pesticide_paf_impacts(
    feed_entries: list[FeedEntry],
) -> tuple[float, float | None, float | None, float | None, float | None]:
    """Returns (pesticide_kg_per_kg, freshwater_paf, terrestrial_paf, insect_paf, bee_hazard).

    PAF values are weighted by cropland area (feed_ratio / yield_kg_ha) rather than by
    pesticide_kg_per_kg_food.  Area-weighting ensures that each feed crop's toxicity
    contribution scales with how much land it actually occupies, not how much pesticide
    it uses per kg of food.  Weighting by pesticide_kg over-represents high-pesticide-
    intensity crops and under-represents high-yield crops (e.g. corn dominates because
    it uses the most pesticide per kg chicken, while wheat's high-paf compounds are
    diluted by corn's large pesticide mass).
    """
    total_pesticide_kg_per_kg = 0.0
    freshwater_numerator = freshwater_denominator = 0.0
    terrestrial_numerator = terrestrial_denominator = 0.0
    insect_numerator = insect_denominator = 0.0
    bee_hazard_numerator = bee_hazard_denominator = 0.0
    for entry in feed_entries:
        feed_ratio = entry.feed.kg_feed_per_kg_output.weighted_average()
        if feed_ratio is None:
            continue
        pesticide_kg_per_kg_food = entry.plant.avg_pesticide_kg_per_kg_food
        if not pesticide_kg_per_kg_food:
            continue
        total_pesticide_kg_per_kg += feed_ratio * pesticide_kg_per_kg_food

        # Use hectares of cropland per kg of animal output as the aggregation weight so
        # that the resulting average PAF matches what you'd get by summing per-crop impacts.
        average_yield = entry.plant.yield_kg_ha.weighted_average()
        if not average_yield or average_yield <= 0:
            continue
        area_ha = feed_ratio / average_yield

        freshwater_paf = entry.plant.avg_pesticide_weighted_freshwater_paf
        terrestrial_paf = entry.plant.avg_pesticide_weighted_terrestrial_paf
        insect_paf = entry.plant.avg_pesticide_weighted_insect_paf
        bee_hazard = entry.plant.avg_pesticide_weighted_bee_hazard
        if freshwater_paf is not None:
            freshwater_numerator += area_ha * freshwater_paf
            freshwater_denominator += area_ha
        if terrestrial_paf is not None:
            terrestrial_numerator += area_ha * terrestrial_paf
            terrestrial_denominator += area_ha
        if insect_paf is not None:
            insect_numerator += area_ha * insect_paf
            insect_denominator += area_ha
        if bee_hazard is not None:
            bee_hazard_numerator += area_ha * bee_hazard
            bee_hazard_denominator += area_ha
    return (
        total_pesticide_kg_per_kg,
        freshwater_numerator / freshwater_denominator if freshwater_denominator else None,
        terrestrial_numerator / terrestrial_denominator if terrestrial_denominator else None,
        insect_numerator / insect_denominator if insect_denominator else None,
        bee_hazard_numerator / bee_hazard_denominator if bee_hazard_denominator else None,
    )
