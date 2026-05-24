"""
raw_plant_pesticide.py — computation wrapper for a plant-pesticide association record.

Wraps a PlantPesticide TypedDict and exposes the kg_ha sourced array as a SourcedArray
for weighted averaging during pesticide impact calculations.
"""

from ...food_types import PlantPesticide
from .sourced_array import SourcedArray


class RawPlantPesticide:
    """Wraps a PlantPesticide record and exposes its sourced array for weighted averaging."""

    def __init__(self, data: PlantPesticide) -> None:
        self.plant_id = data["plant_id"]
        self.pesticide_id = data["pesticide_id"]
        self.kg_ha = SourcedArray(data.get("kg_ha"))
