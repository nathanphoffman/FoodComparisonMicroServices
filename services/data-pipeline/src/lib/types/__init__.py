"""
lib/types/ — computation wrappers for the normalized database pipeline.

RawFood, RawAnimal, RawPlant, RawPesticide, RawAnimalFeed, and RawPlantPesticide
wrap their corresponding TypedDict shapes from food_types.py and expose weighted
averages used by insert_foods_normalized/. pesticide_impact.py holds a crop's
pesticide math, and crop_mix/ sums crop impacts over feed or ingredient mixes.
"""
