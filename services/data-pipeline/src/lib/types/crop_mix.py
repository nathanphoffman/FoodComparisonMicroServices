"""
crop_mix.py — sums crop impacts over a mix of crops, per kg of output.

Used for an animal's feed (kg feed per kg meat / milk / eggs) and for a composite
food's ingredients (kg crop per kg product). Each CropShare pairs one crop with how
many kg of it go into 1 kg of output. All values are on the crop's raw (dry) basis.
"""

from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from .raw_plant import RawPlant


class CropShare:
    """One crop in a mix: `ratio` kg of `plant` per kg of output (None = unknown)."""

    def __init__(self, ratio: float | None, plant: "RawPlant") -> None:
        self.ratio = ratio
        self.plant = plant


def compute_wild_fish(entries: list[CropShare]) -> dict[str, float | None]:
    """Wild fish killed to make the fishmeal / fish oil in the mix, per kg of output.

    The kill belongs to the output (the fish die to make it), so for animals it goes on
    the animal's main row, not the feed row. The species values are the kg-weighted average across
    feeds; today fishmeal and fish oil share one species (anchoveta), so they're equal.
    """
    total_fish_kg = 0.0
    weighted = {"wild_fish_neuron_count": 0.0, "wild_fish_weight_kg": 0.0, "wild_fish_lifespan_years": 0.0}
    for entry in entries:
        ratio = entry.ratio
        fish_kg_per_kg_crop = entry.plant.wild_fish_kg_per_kg.weighted_average()
        if not ratio or not fish_kg_per_kg_crop:
            continue
        fish_kg = ratio * fish_kg_per_kg_crop
        total_fish_kg += fish_kg
        for field in weighted:
            weighted[field] += fish_kg * (getattr(entry.plant, field).weighted_average() or 0.0)
    if total_fish_kg <= 0:
        return {"wild_fish_kg_per_kg": None, **{field: None for field in weighted}}
    return {
        "wild_fish_kg_per_kg": total_fish_kg,
        **{field: value / total_fish_kg for field, value in weighted.items()},
    }


def compute_land_use_square_meters_per_kg(entries: list[CropShare]) -> float:
    """Sums crop land use across the mix, in m² per kg of output."""
    total_land_square_meters = 0.0
    for entry in entries:
        ratio = entry.ratio
        if ratio is None:
            continue
        average_yield_kg_per_ha = entry.plant.yield_kg_ha.weighted_average()
        if average_yield_kg_per_ha and average_yield_kg_per_ha > 0:
            total_land_square_meters += ratio * 10000 / average_yield_kg_per_ha
    return total_land_square_meters


def compute_water_and_emissions(
    entries: list[CropShare],
    pasture_baseline: float = 0.0,
) -> tuple[float, float, float, float]:
    """Returns (total_emissions, green_water, blue_water, grey_water) summed across the mix.

    pasture_baseline is the pasture evapotranspiration in liters per kg of animal output
    (pasture_ha_per_kg_output × pasture_green_water_l_per_ha). It is a water metric and
    only seeds total_green_water. Emissions are in kg CO2-eq and must start at zero.
    Crop emissions use each crop's farm-gate value (see RawPlant.feed_emissions_per_kg):
    an animal doesn't eat a crop's retail stages, and a composite food's own processing
    is added separately.
    """
    total_emissions = 0.0
    total_green_water = pasture_baseline  # liters of green water from pasture grazing itself
    total_blue_water = 0.0
    total_grey_water = 0.0
    for entry in entries:
        ratio = entry.ratio
        if ratio is None:
            continue
        plant_emissions = entry.plant.feed_emissions_per_kg
        if plant_emissions:
            total_emissions += ratio * plant_emissions
        green_water = entry.plant.green_water_per_kg.weighted_average()
        blue_water = entry.plant.blue_water_per_kg.weighted_average()
        grey_water = entry.plant.grey_water_per_kg.weighted_average()
        total_water = entry.plant.water_per_kg.weighted_average()
        if green_water:
            total_green_water += ratio * green_water
        if blue_water:
            total_blue_water += ratio * blue_water
        if grey_water:
            total_grey_water += ratio * grey_water
        if green_water is None and blue_water is None and total_water:
            total_green_water += ratio * total_water
    return total_emissions, total_green_water, total_blue_water, total_grey_water


def compute_per_yield_impacts(
    entries: list[CropShare],
) -> tuple[float, float, float, float]:
    """Returns (soil_erosion, fertilizer, tillage, carbon_capture) summed across the mix."""
    total_soil_erosion = 0.0
    total_fertilizer = 0.0
    total_tillage = 0.0
    total_carbon_capture = 0.0
    for entry in entries:
        ratio = entry.ratio
        if ratio is None:
            continue
        average_yield_kg_per_ha = entry.plant.yield_kg_ha.weighted_average()
        if not average_yield_kg_per_ha or average_yield_kg_per_ha <= 0:
            continue
        soil_erosion = entry.plant.soil_erosion.weighted_average()
        fertilizer = entry.plant.fertilizer_kg_ha.weighted_average()
        tillage = entry.plant.tillage_events_per_year.weighted_average()
        carbon_capture = entry.plant.co2_capture_kg_ha_yr.weighted_average()
        if soil_erosion:
            total_soil_erosion += ratio * soil_erosion / average_yield_kg_per_ha
        if fertilizer:
            total_fertilizer += ratio * fertilizer / average_yield_kg_per_ha
        if tillage:
            total_tillage += ratio * tillage / average_yield_kg_per_ha
        if carbon_capture:
            total_carbon_capture += ratio * carbon_capture / average_yield_kg_per_ha
    return total_soil_erosion, total_fertilizer, total_tillage, total_carbon_capture


def compute_pesticide_paf_impacts(
    entries: list[CropShare],
) -> tuple[float, float | None, float | None, float | None, float | None]:
    """Returns (pesticide_kg_per_kg, freshwater_paf, terrestrial_paf, insect_paf, bee_hazard).

    PAF values are weighted by cropland area (ratio / yield_kg_ha) rather than by
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
    for entry in entries:
        ratio = entry.ratio
        if ratio is None:
            continue
        pesticide_kg_per_kg_food = entry.plant.avg_pesticide_kg_per_kg_food
        if not pesticide_kg_per_kg_food:
            continue
        total_pesticide_kg_per_kg += ratio * pesticide_kg_per_kg_food

        # Use hectares of cropland per kg of animal output as the aggregation weight so
        # that the resulting average PAF matches what you'd get by summing per-crop impacts.
        average_yield = entry.plant.yield_kg_ha.weighted_average()
        if not average_yield or average_yield <= 0:
            continue
        area_ha = ratio / average_yield

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
