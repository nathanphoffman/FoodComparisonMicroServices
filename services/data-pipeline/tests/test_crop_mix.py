import unittest
from types import SimpleNamespace

from src.lib.types.crop_mix.crop_share import CropShare
from src.lib.types.crop_mix.pesticides import AreaWeightedFraction, compute_pesticide_paf_impacts
from src.lib.types.crop_mix.water_and_emissions import compute_water_and_emissions
from src.lib.types.sourced_array import SourcedArray

def sourced_array(value: float | None) -> SourcedArray:
    return SourcedArray(None if value is None else [{"value": value, "confidence": 1.0}])

def plant(**overrides) -> SimpleNamespace:
    fields = dict(
        feed_emissions_per_kg=None,
        green_water_per_kg=sourced_array(None),
        blue_water_per_kg=sourced_array(None),
        grey_water_per_kg=sourced_array(None),
        water_per_kg=sourced_array(None),
        avg_pesticide_kg_per_kg_food=None,
        yield_kg_ha=sourced_array(None),
        pesticide_affected_freshwater_fraction=None,
        pesticide_affected_terrestrial_fraction=None,
        pesticide_affected_insect_fraction=None,
        pesticide_bee_mortality_fraction=None,
    )

    fields.update(overrides)

    return SimpleNamespace(**fields)

class WaterAndEmissionsTests(unittest.TestCase):
    def test_sums_each_crop_by_its_ratio(self):
        crop = plant(
            feed_emissions_per_kg=2.0,
            green_water_per_kg=sourced_array(100),
            blue_water_per_kg=sourced_array(10),
            grey_water_per_kg=sourced_array(1),
        )

        result = compute_water_and_emissions([CropShare(0.5, crop), CropShare(2.0, crop)])
        self.assertEqual(result, (5.0, 250.0, 25.0, 2.5))

    def test_crop_with_unknown_ratio_is_skipped(self):
        crop = plant(feed_emissions_per_kg=2.0)
        self.assertEqual(compute_water_and_emissions([CropShare(None, crop)]), (0.0, 0.0, 0.0, 0.0))

    def test_pasture_baseline_only_seeds_green_water(self):
        self.assertEqual(compute_water_and_emissions([], pasture_baseline=40.0), (0.0, 40.0, 0.0, 0.0))

    def test_total_water_counts_as_green_when_there_is_no_split(self):
        crop = plant(water_per_kg=sourced_array(50))
        self.assertEqual(compute_water_and_emissions([CropShare(2.0, crop)]), (0.0, 100.0, 0.0, 0.0))

    def test_total_water_is_ignored_when_a_split_exists(self):
        crop = plant(water_per_kg=sourced_array(50), blue_water_per_kg=sourced_array(5))
        self.assertEqual(compute_water_and_emissions([CropShare(1.0, crop)]), (0.0, 0.0, 5.0, 0.0))

class AreaWeightedFractionTests(unittest.TestCase):
    def test_no_values_has_no_average(self):
        self.assertIsNone(AreaWeightedFraction().average())

    def test_missing_fraction_is_left_out(self):
        fraction = AreaWeightedFraction()
        fraction.add(1.0, 0.2)
        fraction.add(100.0, None)
        self.assertAlmostEqual(fraction.average(), 0.2)

    def test_larger_area_counts_for_more(self):
        fraction = AreaWeightedFraction()
        fraction.add(1.0, 0.0)
        fraction.add(3.0, 0.4)
        self.assertAlmostEqual(fraction.average(), 0.3)

class PesticideImpactTests(unittest.TestCase):
    def test_totals_pesticide_and_weights_fractions_by_area(self):
        crop = plant(
            avg_pesticide_kg_per_kg_food=0.01,
            yield_kg_ha=sourced_array(1000),
            pesticide_affected_freshwater_fraction=0.5,
        )

        total, freshwater, terrestrial, insect, bee = compute_pesticide_paf_impacts([CropShare(2.0, crop)])
        self.assertAlmostEqual(total, 0.02)
        self.assertAlmostEqual(freshwater, 0.5)
        self.assertEqual((terrestrial, insect, bee), (None, None, None))

    def test_crop_without_yield_adds_pesticide_but_no_fractions(self):
        crop = plant(avg_pesticide_kg_per_kg_food=0.01, pesticide_affected_freshwater_fraction=0.5)
        total, freshwater, *_ = compute_pesticide_paf_impacts([CropShare(1.0, crop)])
        self.assertAlmostEqual(total, 0.01)
        self.assertIsNone(freshwater)

if __name__ == "__main__":
    unittest.main()
