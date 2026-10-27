import unittest

from src.lib.types.sourced_array import SourcedArray


def sourced(value: float, confidence: float) -> dict:
    return {"value": value, "confidence": confidence}


class SourcedArrayTests(unittest.TestCase):
    def test_empty_or_missing_has_no_average(self):
        self.assertIsNone(SourcedArray(None).weighted_average())
        self.assertIsNone(SourcedArray([]).weighted_average())

    def test_zero_total_confidence_has_no_average(self):
        self.assertIsNone(SourcedArray([sourced(5, 0)]).weighted_average())

    def test_equal_confidence_is_a_plain_mean(self):
        self.assertAlmostEqual(SourcedArray([sourced(2, 1), sourced(4, 1)]).weighted_average(), 3.0)

    def test_higher_confidence_pulls_the_average(self):
        self.assertAlmostEqual(SourcedArray([sourced(0, 1), sourced(10, 3)]).weighted_average(), 7.5)


if __name__ == "__main__":
    unittest.main()
