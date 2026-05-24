"""
sourced_array.py — weighted average over a list of sourced values.
Port of SourcedNumberArray.ts and SourcedNutritionalValueArray.ts.
"""

from typing import Optional
from ...food_types import SourcedNumber, NutritionValue, SourcedNutrition


class SourcedArray:
    """Wraps list[SourcedNumber] and computes confidence-weighted average."""

    def __init__(self, items: Optional[list[SourcedNumber]]) -> None:
        self._items: list[SourcedNumber] = items or []

    def weighted_average(self) -> Optional[float]:
        if not self._items:
            return None
        total_weight = sum(s["confidence"] for s in self._items)
        if total_weight == 0:
            return None
        return sum(s["value"] * s["confidence"] for s in self._items) / total_weight


class SourcedNutritionArray:
    """Wraps list[SourcedNutrition] and computes confidence-weighted average per field."""

    def __init__(self, items: list[SourcedNutrition]) -> None:
        self._items = items

    def weighted_average(self) -> Optional[NutritionValue]:
        if not self._items:
            return None
        total_weight = sum(s["confidence"] for s in self._items)
        if total_weight == 0:
            return None

        def avg(key: str) -> Optional[float]:
            vals = [s["value"].get(key) for s in self._items]  # type: ignore[arg-type]
            if all(v is None for v in vals):
                return None
            weighted = sum(
                (v or 0) * s["confidence"]
                for v, s in zip(vals, self._items)
                if v is not None
            )
            w = sum(s["confidence"] for v, s in zip(vals, self._items) if v is not None)
            return weighted / w if w > 0 else None

        return NutritionValue(
            calories=avg("calories") or 0,
            fat=avg("fat") or 0,
            sat_fat=avg("sat_fat") or 0,
            protein=avg("protein") or 0,
            fiber=avg("fiber") or 0,
            sodium=avg("sodium"),
            carbs=avg("carbs"),
            sugar=avg("sugar"),
            cholesterol=avg("cholesterol"),
            trans_fat=avg("trans_fat"),
        )
