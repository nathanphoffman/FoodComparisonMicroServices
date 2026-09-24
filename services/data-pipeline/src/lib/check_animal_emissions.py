"""
check_animal_emissions.py — warns when an animal's computed emissions drift from its published total.

The app computes animal emissions as CO2 + CH4×GWP + N2O×GWP + feed emissions and never
uses the animal's own published emissions_per_kg. A unit slip in one gas field (e.g. milk
CH4 recorded ~5× too high, found 2026-09-24) silently inflates the score, so this check
compares the two after the normalized rows are built and prints a warning for each outlier.
It never fails the build.
"""

import json
import sqlite3
from pathlib import Path

from .load_foods import CATEGORY_FILES
from .regions import Region, resolve_regions
from .types.sourced_array import SourcedArray

# Must match GWP_CH4 / GWP_N2O in services/wasm-calculations/src/calculations/emissions.rs
GWP_CH4 = 28.0
GWP_N2O = 265.0

# Warn when computed / published falls outside this range
MAX_RATIO = 1.5
MIN_RATIO = 1 / MAX_RATIO

COMPUTED_QUERY = """
SELECT f.slug, f.co2_kg_per_kg_output, f.ch4_kg_per_kg_output, f.n2o_kg_per_kg_output,
       feed.emissions_per_kg
FROM   foods_normalized f
LEFT JOIN foods_normalized feed
       ON feed.food_id = f.food_id AND feed.is_feed = 1 AND feed.region = f.region
WHERE  f.is_feed = 0 AND f.type = 'animal' AND f.region = ?
"""


def check_animal_emissions(
    connection: sqlite3.Connection, data_dir: Path, regions: list[Region]
) -> list[str]:
    """Returns (and prints) one warning per animal/region whose computed total is off."""
    animals = _load_animal_items(data_dir)
    warnings: list[str] = []
    for region in regions:
        published = _published_totals(animals, region)
        for slug, co2, ch4, n2o, feed in connection.execute(COMPUTED_QUERY, (region,)):
            if co2 is None or ch4 is None or n2o is None or slug not in published:
                continue  # the app falls back to emissions_per_kg itself
            computed = co2 + ch4 * GWP_CH4 + n2o * GWP_N2O + (feed or 0.0)
            ratio = computed / published[slug]
            if not MIN_RATIO <= ratio <= MAX_RATIO:
                warnings.append(
                    f"[{region}] {slug}: gases + feed = {computed:.2f} kg CO2e/kg but "
                    f"published emissions_per_kg = {published[slug]:.2f} ({ratio:.1f}×)"
                )
    for warning in warnings:
        print(f"Warning: {warning}")
    return warnings


def _load_animal_items(data_dir: Path) -> list[dict]:
    items: list[dict] = []
    for category_name in CATEGORY_FILES:
        category_path = data_dir / "foods" / f"{category_name}.json"
        if category_path.exists():
            items.extend(
                item for item in json.loads(category_path.read_text(encoding="utf-8"))
                if item.get("type") == "animal"
            )
    return items


def _published_totals(animals: list[dict], region: Region) -> dict[str, float]:
    totals: dict[str, float] = {}
    for item in resolve_regions(animals, region):
        total = SourcedArray(item.get("emissions_per_kg")).weighted_average()
        if total:
            totals[item["slug"]] = total
    return totals
