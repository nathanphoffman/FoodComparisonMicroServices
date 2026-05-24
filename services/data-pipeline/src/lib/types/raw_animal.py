from typing import Optional, TYPE_CHECKING
from ...types import Animal
from .sourced_array import SourcedArray

if TYPE_CHECKING:
    from .raw_plant import RawPlant
    from .raw_animal_feed import RawAnimalFeed


class FeedEntry:
    def __init__(self, feed: "RawAnimalFeed", plant: "RawPlant") -> None:
        self.feed = feed
        self.plant = plant


class RawAnimal:
    def __init__(self, data: Animal, feed_entries: list[FeedEntry]) -> None:
        self.neuron_count              = SourcedArray(data.get("neuron_count"))
        self.weight_kg                 = SourcedArray(data.get("weight_kg"))
        self.yield_fraction            = SourcedArray(data.get("yield_fraction"))
        self.pasture_ha_per_kg_output  = SourcedArray(data.get("pasture_ha_per_kg_output"))
        self.pasture_green_water_l_per_ha = SourcedArray(data.get("pasture_green_water_l_per_ha"))
        self.native_fraction           = SourcedArray(data.get("native_fraction"))
        self.bycatch_amount            = SourcedArray(data.get("bycatch_amount"))
        self.ch4_kg_per_kg_output      = SourcedArray(data.get("ch4_kg_per_kg_output"))
        self.n2o_kg_per_kg_output      = SourcedArray(data.get("n2o_kg_per_kg_output"))
        self.co2_kg_per_kg_output      = SourcedArray(data.get("co2_kg_per_kg_output"))
        self._feed_entries             = feed_entries

    def normalized_fields(self) -> dict:
        return {
            "neuron_count":              self.neuron_count.weighted_average(),
            "weight_kg":                 self.weight_kg.weighted_average(),
            "yield_fraction":            self.yield_fraction.weighted_average(),
            "pasture_ha_per_kg_output":  self.pasture_ha_per_kg_output.weighted_average(),
            "pasture_green_water_l_per_ha": self.pasture_green_water_l_per_ha.weighted_average(),
            "native_fraction":           self.native_fraction.weighted_average(),
            "bycatch_amount":            self.bycatch_amount.weighted_average(),
            "ch4_kg_per_kg_output":      self.ch4_kg_per_kg_output.weighted_average(),
            "n2o_kg_per_kg_output":      self.n2o_kg_per_kg_output.weighted_average(),
            "co2_kg_per_kg_output":      self.co2_kg_per_kg_output.weighted_average(),
        }

    def feed_normalized_fields(self) -> Optional[dict]:
        if not self._feed_entries:
            return None

        pasture_ha   = self.pasture_ha_per_kg_output.weighted_average() or 0
        pasture_evap = self.pasture_green_water_l_per_ha.weighted_average() or 0
        pasture_water = pasture_ha * pasture_evap

        emissions = green_water = pasture_water
        blue_water = grey_water = soil_erosion = 0.0
        fertilizer = tillage = co2_capture = pesticide_kg_per_kg = 0.0
        fw_num = fw_den = ter_num = ter_den = 0.0
        ins_num = ins_den = bee_num = bee_den = 0.0
        feed_land_m2 = 0.0

        for entry in self._feed_entries:
            ratio = entry.feed.kg_feed_per_kg_output.weighted_average()
            if ratio is None:
                continue

            avg_yield = entry.plant.yield_kg_ha.weighted_average()
            if avg_yield and avg_yield > 0:
                feed_land_m2 += ratio * 10000 / avg_yield

            e = entry.plant.emissions_per_kg.weighted_average()
            if e: emissions += ratio * e

            gw = entry.plant.green_water_per_kg.weighted_average()
            bw = entry.plant.blue_water_per_kg.weighted_average()
            grw = entry.plant.grey_water_per_kg.weighted_average()
            w = entry.plant.water_per_kg.weighted_average()
            if gw: green_water += ratio * gw
            if bw: blue_water  += ratio * bw
            if grw: grey_water += ratio * grw
            if gw is None and bw is None and w:
                green_water += ratio * w

            if avg_yield and avg_yield > 0:
                se = entry.plant.soil_erosion.weighted_average()
                fe = entry.plant.fertilizer_kg_ha.weighted_average()
                ti = entry.plant.tillage_events_per_year.weighted_average()
                co = entry.plant.co2_capture_kg_ha_yr.weighted_average()
                if se: soil_erosion += ratio * se / avg_yield
                if fe: fertilizer   += ratio * fe / avg_yield
                if ti: tillage      += ratio * ti / avg_yield
                if co: co2_capture  += ratio * co / avg_yield

            pkg = entry.plant.avg_pesticide_kg_per_kg_food
            if pkg:
                pesticide_kg_per_kg += ratio * pkg
                fw  = entry.plant.avg_pesticide_weighted_freshwater_paf
                ter = entry.plant.avg_pesticide_weighted_terrestrial_paf
                ins = entry.plant.avg_pesticide_weighted_insect_paf
                bee = entry.plant.avg_pesticide_weighted_bee_hazard
                w_pkg = ratio * pkg
                if fw:  fw_num  += w_pkg * fw;  fw_den  += w_pkg
                if ter: ter_num += w_pkg * ter; ter_den += w_pkg
                if ins: ins_num += w_pkg * ins; ins_den += w_pkg
                if bee: bee_num += w_pkg * bee; bee_den += w_pkg

        return {
            "yield_kg_ha": None, "yield_fraction": None,
            "land_m2_per_kg":        feed_land_m2 or None,
            "water_per_kg":          (green_water + blue_water) or None,
            "green_water_per_kg":    green_water or None,
            "blue_water_per_kg":     blue_water or None,
            "grey_water_per_kg":     grey_water or None,
            "soil_erosion":          soil_erosion or None,
            "pesticide_kg_ha": None,
            "fertilizer_kg_ha":      fertilizer or None,
            "emissions_per_kg":      emissions or None,
            "tillage_events_per_year": tillage or None,
            "co2_capture_kg_ha_yr":  co2_capture or None,
            "pesticide_freshwater_paf":  fw_num  / fw_den  if fw_den  else None,
            "pesticide_terrestrial_paf": ter_num / ter_den if ter_den else None,
            "pesticide_insect_paf":      ins_num / ins_den if ins_den else None,
            "pesticide_bee_hazard":      bee_num / bee_den if bee_den else None,
            "pesticide_kg_per_kg_food":  pesticide_kg_per_kg or None,
        }
