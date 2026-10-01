"""
check_plant_pesticides.py — warns when a farmed plant has no pesticide data.

The app treats missing pesticide fractions as zero, so a crop with cropland but no
pesticide data gets no insect, bee or worm deaths and looks far better than any sprayed
crop (cassava, beet sugar and five others did, found 2026-10-01). Crops that really are
unsprayed should say so with pesticide_kg_ha = 0 (e.g. maple syrup, Brazil nuts).
It never fails the build.
"""

import sqlite3

from .regions import Region

MISSING_QUERY = """
SELECT slug
FROM   foods_normalized
WHERE  is_feed = 0 AND type = 'plant' AND region = ?
  AND  yield_kg_ha > 0
  AND  pesticide_insect_paf IS NULL
  AND  (pesticide_kg_ha IS NULL OR pesticide_kg_ha > 0)
"""


def check_plant_pesticides(connection: sqlite3.Connection, regions: list[Region]) -> list[str]:
    """Returns (and prints) one warning per plant/region with cropland but no pesticide data."""
    warnings = [
        f"[{region}] {slug}: has cropland but no pesticide data — scored as zero pesticide deaths. "
        "Add pesticides, or set pesticide_kg_ha to 0 if it is truly unsprayed."
        for region in regions
        for (slug,) in connection.execute(MISSING_QUERY, (region,))
    ]
    for warning in warnings:
        print(f"Warning: {warning}")
    return warnings
