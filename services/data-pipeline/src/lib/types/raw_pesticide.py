from ...types import Pesticide
from .sourced_array import SourcedArray


class RawPesticide:
    def __init__(self, data: Pesticide) -> None:
        self.id = data["id"]
        self.freshwater_paf = SourcedArray(data["freshwater_paf"])
        self.terrestrial_paf = SourcedArray(data.get("terrestrial_paf"))
        self.insect_paf = SourcedArray(data.get("insect_paf"))
        self.bee_ld50 = SourcedArray(data.get("bee_ld50"))

    @property
    def avg_freshwater_paf(self):   return self.freshwater_paf.weighted_average()
    @property
    def avg_terrestrial_paf(self):  return self.terrestrial_paf.weighted_average()
    @property
    def avg_insect_paf(self):       return self.insect_paf.weighted_average()
    @property
    def avg_bee_ld50(self):         return self.bee_ld50.weighted_average()
