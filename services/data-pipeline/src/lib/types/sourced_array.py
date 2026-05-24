"""
sourced_array.py — weighted average over a list of sourced values.

Port of SourcedNumberArray.ts and SourcedNutritionalValueArray.ts.
Confidence scores are used as weights; higher confidence pulls the average more strongly.
"""

from ...food_types import SourcedNumber, NutritionValue, SourcedNutrition


class SourcedArray:
    """Wraps list[SourcedNumber] and computes a confidence-weighted average."""

    def __init__(self, items: list[SourcedNumber] | None) -> None:
        self._items: list[SourcedNumber] = items or []

    def weighted_average(self) -> float | None:
        """Returns the confidence-weighted average, or None if the list is empty."""
        if not self._items:
            return None
        total_confidence = sum(sourced["confidence"] for sourced in self._items)
        if total_confidence == 0:
            return None
        return sum(
            sourced["value"] * sourced["confidence"] for sourced in self._items
        ) / total_confidence


class SourcedNutritionArray:
    """Wraps list[SourcedNutrition] and computes a confidence-weighted average per field."""

    def __init__(self, items: list[SourcedNutrition]) -> None:
        self._items = items

    def weighted_average(self) -> NutritionValue | None:
        """Returns confidence-weighted averages for all nutrition fields, or None if empty."""
        if not self._items:
            return None
        total_confidence = sum(sourced["confidence"] for sourced in self._items)
        if total_confidence == 0:
            return None
        return NutritionValue(
            calories=self._weighted_average_for_field("calories") or 0,
            fat=self._weighted_average_for_field("fat") or 0,
            sat_fat=self._weighted_average_for_field("sat_fat") or 0,
            protein=self._weighted_average_for_field("protein") or 0,
            fiber=self._weighted_average_for_field("fiber") or 0,
            sodium=self._weighted_average_for_field("sodium"),
            carbs=self._weighted_average_for_field("carbs"),
            sugar=self._weighted_average_for_field("sugar"),
            cholesterol=self._weighted_average_for_field("cholesterol"),
            trans_fat=self._weighted_average_for_field("trans_fat"),
        )

    def _weighted_average_for_field(self, field_name: str) -> float | None:
        """Returns the confidence-weighted average for a single nutrition field."""
        field_values = [sourced["value"].get(field_name) for sourced in self._items]  # type: ignore[arg-type]
        if all(field_value is None for field_value in field_values):
            return None
        weighted_sum = sum(
            (field_value or 0) * sourced["confidence"]
            for field_value, sourced in zip(field_values, self._items)
            if field_value is not None
        )
        total_confidence_for_field = sum(
            sourced["confidence"]
            for field_value, sourced in zip(field_values, self._items)
            if field_value is not None
        )
        return weighted_sum / total_confidence_for_field if total_confidence_for_field > 0 else None
