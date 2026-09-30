"""
water_and_emissions.py — water footprint (green / blue / grey) and emissions summed
across a crop mix, per kg of output.
"""

from .crop_share import CropShare


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
        # No green / blue split sourced: count the whole water footprint as green.
        if green_water is None and blue_water is None and total_water:
            total_green_water += ratio * total_water
    return total_emissions, total_green_water, total_blue_water, total_grey_water
