"""
lib/types/ — computation wrappers for the normalized database pipeline.

raw/ holds RawFood, RawAnimal, RawPlant, RawAnimalFeed and RawComposite, and pesticides/ holds
RawPesticide, RawPlantPesticide and a crop's pesticide math (pesticide_impact.py). They wrap their
corresponding TypedDict shapes from food_types.py and expose weighted averages used by
insert/foods/insert_foods_normalized/. crop_mix/ sums crop impacts over feed or ingredient mixes.
"""
