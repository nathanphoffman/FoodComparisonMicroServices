"""
pesticides.py — pesticide amount and affected-species fractions across a crop mix,
per kg of output.
"""

from .crop_share import CropShare


class AreaWeightedFraction:
    """Running average of a per-crop fraction, weighted by each crop's hectares.
    Crops with no value for the fraction are left out of both sides."""

    def __init__(self) -> None:
        self._weighted_sum = 0.0
        self._total_area_ha = 0.0

    def add(self, area_ha: float, fraction: float | None) -> None:
        if fraction is None:
            return
        self._weighted_sum += area_ha * fraction
        self._total_area_ha += area_ha

    def average(self) -> float | None:
        return self._weighted_sum / self._total_area_ha if self._total_area_ha else None


def compute_pesticide_paf_impacts(
    entries: list[CropShare],
) -> tuple[float, float | None, float | None, float | None, float | None]:
    """Returns (pesticide_kg_per_kg, freshwater_paf, terrestrial_paf, insect_paf, bee_hazard).

    Each crop's PAF here is already its dose-scaled affected fraction (see
    pesticide_impact.dose_scaled_affected_fraction); across crops they are weighted by
    cropland area (ratio / yield_kg_ha) rather than by pesticide_kg_per_kg_food.
    Area-weighting ensures that each feed crop's toxicity contribution scales with how
    much land it actually occupies, not how much pesticide it uses per kg of food.
    Weighting by pesticide_kg over-represents high-pesticide-intensity crops and
    under-represents high-yield crops (e.g. corn dominates because it uses the most
    pesticide per kg chicken, while wheat's high-paf compounds are diluted by corn's
    large pesticide mass).
    """
    total_pesticide_kg_per_kg = 0.0
    freshwater = AreaWeightedFraction()
    terrestrial = AreaWeightedFraction()
    insect = AreaWeightedFraction()
    bee_hazard = AreaWeightedFraction()
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

        freshwater.add(area_ha, entry.plant.pesticide_affected_freshwater_fraction)
        terrestrial.add(area_ha, entry.plant.pesticide_affected_terrestrial_fraction)
        insect.add(area_ha, entry.plant.pesticide_affected_insect_fraction)
        bee_hazard.add(area_ha, entry.plant.pesticide_bee_mortality_fraction)
    return (
        total_pesticide_kg_per_kg,
        freshwater.average(),
        terrestrial.average(),
        insect.average(),
        bee_hazard.average(),
    )
