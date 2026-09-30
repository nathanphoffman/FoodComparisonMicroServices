"""
land.py — land use and per-hectare impacts (soil erosion, fertilizer, tillage,
carbon capture) summed across a crop mix, per kg of output.
"""

from .crop_share import CropShare

SQUARE_METERS_PER_HA = 10000

# RawPlant attributes that are sourced per hectare per year. Each is converted to
# per kg of output by dividing by the crop's yield.
PER_HECTARE_FIELDS = (
    "soil_erosion",
    "fertilizer_kg_ha",
    "tillage_events_per_year",
    "co2_capture_kg_ha_yr",
)


def compute_land_use_square_meters_per_kg(entries: list[CropShare]) -> float:
    """Sums crop land use across the mix, in m² per kg of output."""
    total_land_square_meters = 0.0
    for entry in entries:
        ratio = entry.ratio
        if ratio is None:
            continue
        average_yield_kg_per_ha = entry.plant.yield_kg_ha.weighted_average()
        if average_yield_kg_per_ha and average_yield_kg_per_ha > 0:
            total_land_square_meters += ratio * SQUARE_METERS_PER_HA / average_yield_kg_per_ha
    return total_land_square_meters


def compute_per_yield_impacts(
    entries: list[CropShare],
) -> tuple[float, float, float, float]:
    """Returns (soil_erosion, fertilizer, tillage, carbon_capture) summed across the mix."""
    totals = dict.fromkeys(PER_HECTARE_FIELDS, 0.0)
    for entry in entries:
        ratio = entry.ratio
        if ratio is None:
            continue
        average_yield_kg_per_ha = entry.plant.yield_kg_ha.weighted_average()
        if not average_yield_kg_per_ha or average_yield_kg_per_ha <= 0:
            continue
        for field_name in PER_HECTARE_FIELDS:
            per_hectare_value = getattr(entry.plant, field_name).weighted_average()
            if per_hectare_value:
                totals[field_name] += ratio * per_hectare_value / average_yield_kg_per_ha
    soil_erosion, fertilizer, tillage, carbon_capture = (totals[name] for name in PER_HECTARE_FIELDS)
    return soil_erosion, fertilizer, tillage, carbon_capture
