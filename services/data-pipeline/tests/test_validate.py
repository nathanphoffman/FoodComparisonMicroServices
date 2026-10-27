import unittest

from src.lib.checks.validate import (
    assert_composite_ingredients,
    assert_land_types,
    assert_sourced_array,
)


def sourced_fraction(value: float) -> list[dict]:
    return [{"value": value, "confidence": 1.0}]


class AssertSourcedArrayTests(unittest.TestCase):
    def test_rejects_none_and_empty(self):
        for missing in (None, []):
            with self.assertRaises(ValueError):
                assert_sourced_array(missing, "emissions")

    def test_accepts_a_filled_array(self):
        assert_sourced_array(sourced_fraction(1.0), "emissions")


class AssertLandTypesTests(unittest.TestCase):
    def test_none_is_allowed(self):
        assert_land_types(None, "rice")

    def test_unknown_key_is_rejected(self):
        with self.assertRaisesRegex(ValueError, "unknown land types"):
            assert_land_types({"moon": 1.0}, "rice")

    def test_fractions_must_sum_to_one(self):
        with self.assertRaisesRegex(ValueError, "sum to 1"):
            assert_land_types({"dry": 0.5, "wetland": 0.3}, "rice")

    def test_small_rounding_error_is_tolerated(self):
        assert_land_types({"dry": 0.5, "wetland": 0.505}, "rice")


class AssertCompositeIngredientsTests(unittest.TestCase):
    FOODS = {"flour": {"id": 1}, "beef": {"id": 2}}
    PLANT_IDS = {1}

    def composite(self, *ingredients: dict) -> dict:
        return {"slug": "bread", "ingredients": list(ingredients)}

    def check(self, *ingredients: dict) -> None:
        assert_composite_ingredients(self.composite(*ingredients), self.FOODS, self.PLANT_IDS)

    def test_valid_composite_passes(self):
        self.check(
            {"food_slug": "flour", "fraction": sourced_fraction(0.7)},
            {"label": "water", "fraction": sourced_fraction(0.3)},
        )

    def test_empty_ingredient_list_is_rejected(self):
        with self.assertRaisesRegex(ValueError, "non-empty"):
            self.check()

    def test_unknown_food_is_rejected(self):
        with self.assertRaisesRegex(ValueError, "unknown ingredient"):
            self.check({"food_slug": "ghost", "fraction": sourced_fraction(1.0)})

    def test_animal_ingredient_is_rejected(self):
        with self.assertRaisesRegex(ValueError, "must be a plant food"):
            self.check({"food_slug": "beef", "fraction": sourced_fraction(1.0)})

    def test_non_food_ingredient_needs_a_label(self):
        with self.assertRaisesRegex(ValueError, "needs a label"):
            self.check({"fraction": sourced_fraction(1.0)})

    def test_fractions_must_sum_to_one(self):
        with self.assertRaisesRegex(ValueError, "sum to 1"):
            self.check({"food_slug": "flour", "fraction": sourced_fraction(0.5)})


if __name__ == "__main__":
    unittest.main()
