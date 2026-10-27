"""
summary.py — every crop-mix total in one place, so an animal's feed and a composite's
ingredients don't each have to call and unpack five functions.
"""

from dataclasses import dataclass

from .crop_share import CropShare
from .land import compute_land_use_square_meters_per_kg, compute_per_yield_impacts
from .pesticides import compute_pesticide_paf_impacts
from .water_and_emissions import compute_water_and_emissions

@dataclass(frozen=True)
class CropMixTotals:
    """All the sums over a crop mix, per kg of output. Zero means nothing contributed."""

    land_square_meters: float
    emissions: float
    green_water: float
    blue_water: float
    grey_water: float
    soil_erosion: float
    fertilizer: float
    tillage: float
    carbon_capture: float
    pesticide_kg_per_kg: float
    freshwater_paf: float | None
    terrestrial_paf: float | None
    insect_paf: float | None
    bee_hazard: float | None

    def pesticide_paf_fields(self) -> dict[str, float | None]:
        """The pesticide-toxicity columns, named as in the normalized database."""

        return {
            "pesticide_freshwater_paf":  self.freshwater_paf,
            "pesticide_terrestrial_paf": self.terrestrial_paf,
            "pesticide_insect_paf":      self.insect_paf,
            "pesticide_bee_hazard":      self.bee_hazard,
            "pesticide_kg_per_kg_food":  self.pesticide_kg_per_kg or None,
        }

def summarize_crop_mix(entries: list[CropShare], pasture_baseline: float = 0.0) -> CropMixTotals:
    """Sums land, water, emissions, per-hectare impacts and pesticides over the mix.
    pasture_baseline seeds green water (see compute_water_and_emissions)."""

    emissions, green_water, blue_water, grey_water = compute_water_and_emissions(entries, pasture_baseline=pasture_baseline)
    soil_erosion, fertilizer, tillage, carbon_capture = compute_per_yield_impacts(entries)
    pesticide_kg_per_kg, freshwater_paf, terrestrial_paf, insect_paf, bee_hazard = compute_pesticide_paf_impacts(entries)

    return CropMixTotals(
        land_square_meters=compute_land_use_square_meters_per_kg(entries),
        emissions=emissions, green_water=green_water, blue_water=blue_water, grey_water=grey_water,
        soil_erosion=soil_erosion, fertilizer=fertilizer, tillage=tillage, carbon_capture=carbon_capture,
        pesticide_kg_per_kg=pesticide_kg_per_kg,
        freshwater_paf=freshwater_paf, terrestrial_paf=terrestrial_paf, insect_paf=insect_paf, bee_hazard=bee_hazard,
    )
