"""
wild_fish.py — wild fish killed to make the fishmeal / fish oil in a crop mix,
per kg of output.
"""

from .crop_share import CropShare

# Species traits averaged across the mix, weighted by kg of fish behind each crop.
WILD_FISH_TRAIT_FIELDS = (
    "wild_fish_neuron_count",
    "wild_fish_weight_kg",
    "wild_fish_lifespan_years",
)


def compute_wild_fish(entries: list[CropShare]) -> dict[str, float | None]:
    """Wild fish killed to make the fishmeal / fish oil in the mix, per kg of output.

    The kill belongs to the output (the fish die to make it), so for animals it goes on
    the animal's main row, not the feed row. The species values are the kg-weighted average across
    feeds; today fishmeal and fish oil share one species (anchoveta), so they're equal.
    """
    total_fish_kg = 0.0
    weighted = dict.fromkeys(WILD_FISH_TRAIT_FIELDS, 0.0)
    for entry in entries:
        ratio = entry.ratio
        fish_kg_per_kg_crop = entry.plant.wild_fish_kg_per_kg.weighted_average()
        if not ratio or not fish_kg_per_kg_crop:
            continue
        fish_kg = ratio * fish_kg_per_kg_crop
        total_fish_kg += fish_kg
        for field_name in weighted:
            weighted[field_name] += fish_kg * (getattr(entry.plant, field_name).weighted_average() or 0.0)
    if total_fish_kg <= 0:
        return {"wild_fish_kg_per_kg": None, **{field_name: None for field_name in weighted}}
    return {
        "wild_fish_kg_per_kg": total_fish_kg,
        **{field_name: weighted_total / total_fish_kg for field_name, weighted_total in weighted.items()},
    }
