"""
food_types — raw data interfaces for the pipeline.

Port of packages/data-pipeline/src/types.ts (originally lib/types.ts). Split by topic:
shared.py (building blocks), foods.py, sources.py and impacts.py. Import from here, not from the files.
"""

from .shared import SourcedNumber, NutritionValue, MICRONUTRIENT_KEYS, AMINO_ACID_KEYS, SourcedNutrition
from .foods import Food, Animal, Plant, AnimalFeed, Composite, CompositeIngredient
from .sources import Source
from .impacts import PlantAnimalKill, Pesticide, PlantPesticide

__all__ = [
    "SourcedNumber",
    "NutritionValue",
    "MICRONUTRIENT_KEYS",
    "AMINO_ACID_KEYS",
    "SourcedNutrition",
    "Food",
    "Animal",
    "Plant",
    "AnimalFeed",
    "Composite",
    "CompositeIngredient",
    "Source",
    "PlantAnimalKill",
    "Pesticide",
    "PlantPesticide",
]
