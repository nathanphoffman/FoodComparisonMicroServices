"""
lookup_tables.py — indexes the loaded records by id, so each food's plant, animal,
feed, pesticide and composite data can be joined in memory.
"""

from dataclasses import dataclass

from ...food_types import (
    Food, Plant, Animal, Pesticide, PlantPesticide, AnimalFeed, Composite, CompositeIngredient,
)
from ..types.raw_animal_feed import RawAnimalFeed
from ..types.raw_pesticide import RawPesticide
from ..types.raw_plant_pesticide import RawPlantPesticide


@dataclass
class LookupTables:
    food_by_id:                   dict[int, Food]
    plant_by_food_id:             dict[int, Plant]
    plant_by_plant_id:            dict[int, Plant]
    animal_by_food_id:            dict[int, Animal]
    pesticide_by_id:              dict[int, RawPesticide]
    plant_pesticides_by_plant_id: dict[int, list[RawPlantPesticide]]
    feed_by_animal_id:            dict[int, list[RawAnimalFeed]]
    composite_by_food_id:         dict[int, Composite]
    composite_ingredients:        list[CompositeIngredient]

    @classmethod
    def build(
        cls,
        foods: list[Food],
        plants: list[Plant],
        animals: list[Animal],
        plant_pesticides: list[PlantPesticide],
        pesticides: list[Pesticide],
        animal_feed: list[AnimalFeed],
        composites: list[Composite],
        composite_ingredients: list[CompositeIngredient],
    ) -> "LookupTables":
        return cls(
            food_by_id={food["id"]: food for food in foods},
            plant_by_food_id={plant["food_id"]: plant for plant in plants},
            plant_by_plant_id={plant["id"]: plant for plant in plants},
            animal_by_food_id={animal["food_id"]: animal for animal in animals},
            pesticide_by_id={pesticide["id"]: RawPesticide(pesticide) for pesticide in pesticides},
            plant_pesticides_by_plant_id=_group_plant_pesticides(plant_pesticides),
            feed_by_animal_id=_group_animal_feed(animal_feed),
            composite_by_food_id={composite["food_id"]: composite for composite in composites},
            composite_ingredients=composite_ingredients,
        )


def _group_plant_pesticides(
    plant_pesticides: list[PlantPesticide],
) -> dict[int, list[RawPlantPesticide]]:
    """Returns RawPlantPesticide wrappers grouped by plant_id."""
    index: dict[int, list[RawPlantPesticide]] = {}
    for plant_pesticide in plant_pesticides:
        index.setdefault(plant_pesticide["plant_id"], []).append(
            RawPlantPesticide(plant_pesticide)
        )
    return index


def _group_animal_feed(animal_feed: list[AnimalFeed]) -> dict[int, list[RawAnimalFeed]]:
    """Returns RawAnimalFeed wrappers grouped by animal_id."""
    index: dict[int, list[RawAnimalFeed]] = {}
    for feed_entry in animal_feed:
        index.setdefault(feed_entry["animal_id"], []).append(RawAnimalFeed(feed_entry))
    return index
