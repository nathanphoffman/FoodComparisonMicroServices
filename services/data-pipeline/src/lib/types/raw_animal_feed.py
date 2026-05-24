from ...types import AnimalFeed
from .sourced_array import SourcedArray


class RawAnimalFeed:
    def __init__(self, data: AnimalFeed) -> None:
        self.animal_id = data["animal_id"]
        self.plant_id = data["plant_id"]
        self.kg_feed_per_kg_output = SourcedArray(data["kg_feed_per_kg_output"])
