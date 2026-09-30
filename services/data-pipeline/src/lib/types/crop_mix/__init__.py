"""
crop_mix — sums crop impacts over a mix of crops, per kg of output.

Used for an animal's feed (kg feed per kg meat / milk / eggs) and for a composite
food's ingredients (kg crop per kg product). Each CropShare pairs one crop with how
many kg of it go into 1 kg of output. All values are on the crop's raw (dry) basis.

  - crop_share.py          — the CropShare building block
  - land.py                — land use and per-hectare impacts (erosion, fertilizer …)
  - water_and_emissions.py — water footprint and emissions
  - pesticides.py          — pesticide amount and affected-species fractions
  - wild_fish.py           — wild fish killed for fishmeal / fish oil
"""

from .crop_share import CropShare
from .land import compute_land_use_square_meters_per_kg, compute_per_yield_impacts
from .pesticides import compute_pesticide_paf_impacts
from .water_and_emissions import compute_water_and_emissions
from .wild_fish import compute_wild_fish

__all__ = [
    "CropShare",
    "compute_land_use_square_meters_per_kg",
    "compute_per_yield_impacts",
    "compute_pesticide_paf_impacts",
    "compute_water_and_emissions",
    "compute_wild_fish",
]
