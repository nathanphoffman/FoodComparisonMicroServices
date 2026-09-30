"""
crop_share.py — one crop in a crop mix, and how much of it goes into the output.
"""

from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from ..raw_plant import RawPlant


class CropShare:
    """One crop in a mix: `ratio` kg of `plant` per kg of output (None = unknown)."""

    def __init__(self, ratio: float | None, plant: "RawPlant") -> None:
        self.ratio = ratio
        self.plant = plant
