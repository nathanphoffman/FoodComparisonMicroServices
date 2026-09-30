"""
load_foods — reads all category JSON files and assembles in-memory data structures.

The JSON files use a flat format: each file is a list of food objects with all
fields (base + animal/plant-specific + feed/pesticide sub-lists) inline.
This package normalises that into the separate lists the insert functions expect.

  - category_keys.py   — which files to read and which fields belong to which record
  - loader.py          — load_category_foods() and the CategoryData it returns
  - extract_records.py — splits one JSON item into food / animal / plant records
  - composites.py      — builds composite records and their ingredient rows
"""

from .category_keys import CATEGORY_FILES
from .loader import CategoryData, load_category_foods

__all__ = ["CATEGORY_FILES", "CategoryData", "load_category_foods"]
