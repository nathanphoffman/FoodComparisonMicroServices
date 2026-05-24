from ...types import PlantPesticide
from .sourced_array import SourcedArray


class RawPlantPesticide:
    def __init__(self, data: PlantPesticide) -> None:
        self.plant_id = data["plant_id"]
        self.pesticide_id = data["pesticide_id"]
        self.kg_ha = SourcedArray(data.get("kg_ha"))
