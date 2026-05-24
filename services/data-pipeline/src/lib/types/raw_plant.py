from typing import Optional
from ...food_types import Plant
from .sourced_array import SourcedArray
from .raw_pesticide import RawPesticide
from .raw_plant_pesticide import RawPlantPesticide


BEE_WEIGHT_KG = 1e-4  # ~100 mg honeybee


class PesticideAssociation:
    def __init__(self, plant_pesticide: RawPlantPesticide, pesticide: RawPesticide) -> None:
        self.plant_pesticide = plant_pesticide
        self.pesticide = pesticide


class RawPlant:
    def __init__(self, data: Plant, pesticide_assocs: list[PesticideAssociation]) -> None:
        self.id = data["id"]
        self.yield_kg_ha          = SourcedArray(data.get("yield_kg_ha"))
        self.yield_fraction       = SourcedArray(data.get("yield_fraction"))
        self.water_per_kg         = SourcedArray(data.get("water_per_kg"))
        self.green_water_per_kg   = SourcedArray(data.get("green_water_per_kg"))
        self.blue_water_per_kg    = SourcedArray(data.get("blue_water_per_kg"))
        self.grey_water_per_kg    = SourcedArray(data.get("grey_water_per_kg"))
        self.soil_erosion         = SourcedArray(data.get("soil_erosion"))
        self.pesticide_kg_ha      = SourcedArray(data.get("pesticide_kg_ha"))
        self.fertilizer_kg_ha     = SourcedArray(data.get("fertilizer_kg_ha"))
        self.emissions_per_kg     = SourcedArray(data.get("emissions_per_kg"))
        self.tillage_events_per_year = SourcedArray(data.get("tillage_events_per_year"))
        self.co2_capture_kg_ha_yr = SourcedArray(data.get("co2_capture_kg_ha_yr"))
        self._pesticide_assocs    = pesticide_assocs

    @property
    def avg_pesticide_kg_per_kg_food(self) -> Optional[float]:
        yield_avg = self.yield_kg_ha.weighted_average()
        if yield_avg is None or yield_avg <= 0:
            return None
        total = 0.0
        for assoc in self._pesticide_assocs:
            kg_ha = assoc.plant_pesticide.kg_ha.weighted_average()
            if kg_ha is not None:
                total += kg_ha / yield_avg
        return total or None

    def _weighted_paf(self, attr: str) -> Optional[float]:
        numerator = denominator = 0.0
        for assoc in self._pesticide_assocs:
            kg_ha = assoc.plant_pesticide.kg_ha.weighted_average()
            paf = getattr(assoc.pesticide, attr)
            if kg_ha is not None and paf is not None:
                numerator   += kg_ha * paf
                denominator += kg_ha
        return numerator / denominator if denominator > 0 else None

    @property
    def avg_pesticide_weighted_freshwater_paf(self) -> Optional[float]:
        return self._weighted_paf("avg_freshwater_paf")

    @property
    def avg_pesticide_weighted_terrestrial_paf(self) -> Optional[float]:
        return self._weighted_paf("avg_terrestrial_paf")

    @property
    def avg_pesticide_weighted_insect_paf(self) -> Optional[float]:
        return self._weighted_paf("avg_insect_paf")

    @property
    def avg_pesticide_weighted_bee_hazard(self) -> Optional[float]:
        numerator = denominator = 0.0
        for assoc in self._pesticide_assocs:
            kg_ha  = assoc.plant_pesticide.kg_ha.weighted_average()
            ld50   = assoc.pesticide.avg_bee_ld50
            if kg_ha is not None and ld50 is not None and ld50 > 0:
                hazard = kg_ha / (ld50 * BEE_WEIGHT_KG)
                numerator   += kg_ha * hazard
                denominator += kg_ha
        return numerator / denominator if denominator > 0 else None

    def normalized_fields(self) -> dict:
        return {
            "yield_kg_ha":               self.yield_kg_ha.weighted_average(),
            "yield_fraction":            self.yield_fraction.weighted_average(),
            "water_per_kg":              self.water_per_kg.weighted_average(),
            "green_water_per_kg":        self.green_water_per_kg.weighted_average(),
            "blue_water_per_kg":         self.blue_water_per_kg.weighted_average(),
            "grey_water_per_kg":         self.grey_water_per_kg.weighted_average(),
            "soil_erosion":              self.soil_erosion.weighted_average(),
            "pesticide_kg_ha":           self.pesticide_kg_ha.weighted_average(),
            "fertilizer_kg_ha":          self.fertilizer_kg_ha.weighted_average(),
            "emissions_per_kg":          self.emissions_per_kg.weighted_average(),
            "tillage_events_per_year":   self.tillage_events_per_year.weighted_average(),
            "co2_capture_kg_ha_yr":      self.co2_capture_kg_ha_yr.weighted_average(),
            "pesticide_freshwater_paf":  self.avg_pesticide_weighted_freshwater_paf,
            "pesticide_terrestrial_paf": self.avg_pesticide_weighted_terrestrial_paf,
            "pesticide_insect_paf":      self.avg_pesticide_weighted_insect_paf,
            "pesticide_bee_hazard":      self.avg_pesticide_weighted_bee_hazard,
            "pesticide_kg_per_kg_food":  self.avg_pesticide_kg_per_kg_food,
            "land_m2_per_kg":            (10000 / self.yield_kg_ha.weighted_average())
                                         if self.yield_kg_ha.weighted_average() else None,
        }
