"""
regions.py — resolves region-tagged sourced values before normalization.

Each SourcedValue may carry an optional "region" tag ("US" or "world").
Untagged values are treated as world values. The normalized database is built
once per region, and this module rewrites every sourced array so the existing
weighted-average code only sees the values that apply to that region:

  - world — untagged / "world" values only
  - us    — "US" values; falls back to world values when a field has no US data
  - avg   — 50/50 mean of the world average and the US average
            (falls back to whichever side exists)

Arrays with no US-tagged values are left unchanged for every region.
"""

import copy
from typing import Any, Literal

Region = Literal["world", "us", "avg"]

REGIONS: list[Region] = ["world", "us", "avg"]

US_TAG = "US"


def resolve_regions(data: Any, region: Region) -> Any:
    """Returns a deep copy of data with every sourced array resolved for the given region."""
    return _resolve(copy.deepcopy(data), region)


def _resolve(node: Any, region: Region) -> Any:
    """Walks lists / dicts / dataclass-like objects and resolves sourced arrays in place."""
    if isinstance(node, list):
        if _is_sourced_array(node):
            return _resolve_sourced_array(node, region)
        return [_resolve(child, region) for child in node]
    if isinstance(node, dict):
        return {key: _resolve(child, region) for key, child in node.items()}
    if hasattr(node, "__dataclass_fields__"):
        for field_name in node.__dataclass_fields__:
            setattr(node, field_name, _resolve(getattr(node, field_name), region))
    return node


def _is_sourced_array(node: list) -> bool:
    """True if the list is a non-empty array of {value, confidence, ...} objects."""
    return bool(node) and all(
        isinstance(item, dict) and "value" in item and "confidence" in item for item in node
    )


def _resolve_sourced_array(items: list[dict], region: Region) -> list[dict]:
    """Filters or collapses one sourced array for the given region."""
    us_items = [item for item in items if item.get("region") == US_TAG]
    if not us_items:
        return items
    world_items = [item for item in items if item.get("region") != US_TAG]

    if region == "world":
        return world_items or us_items
    if region == "us":
        return us_items
    # avg — collapse each side to its own weighted average, then weight them equally
    if not world_items:
        return us_items
    if not all(isinstance(item["value"], (int, float)) for item in items):
        # Non-numeric values (e.g. nutrition dicts) — pool everything instead
        return items
    return [
        {"value": _weighted_average(world_items), "confidence": 1, "region": "world"},
        {"value": _weighted_average(us_items), "confidence": 1, "region": US_TAG},
    ]


def _weighted_average(items: list[dict]) -> float:
    """Confidence-weighted average of numeric sourced values."""
    total_confidence = sum(item["confidence"] for item in items)
    if total_confidence == 0:
        return sum(item["value"] for item in items) / len(items)
    return sum(item["value"] * item["confidence"] for item in items) / total_confidence
