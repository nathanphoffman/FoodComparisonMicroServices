"""
raw_pesticide.py — computation wrapper for a pesticide record.

Wraps a Pesticide TypedDict and exposes weighted averages for each potency-of-effect
(PAF) field. PAF = Potentially Affected Fraction of species, a measure of ecotoxicity.
LD50 = the dose required to kill 50% of a test population, used for bee hazard scoring.
"""

from ...food_types import Pesticide
from .sourced_array import SourcedArray


class RawPesticide:
    """Wraps a Pesticide record and exposes weighted averages for each ecotoxicity field."""

    def __init__(self, data: Pesticide) -> None:
        self.id = data["id"]
        self.freshwater_paf = SourcedArray(data["freshwater_paf"])
        self.terrestrial_paf = SourcedArray(data.get("terrestrial_paf"))
        self.insect_paf = SourcedArray(data.get("insect_paf"))
        self.bee_ld50 = SourcedArray(data.get("bee_ld50"))

    @property
    def avg_freshwater_paf(self) -> float | None:
        """Confidence-weighted average freshwater PAF across all sourced values."""
        return self.freshwater_paf.weighted_average()

    @property
    def avg_terrestrial_paf(self) -> float | None:
        """Confidence-weighted average terrestrial PAF across all sourced values."""
        return self.terrestrial_paf.weighted_average()

    @property
    def avg_insect_paf(self) -> float | None:
        """Confidence-weighted average insect PAF across all sourced values."""
        return self.insect_paf.weighted_average()

    @property
    def avg_bee_ld50(self) -> float | None:
        """Confidence-weighted average bee LD50 across all sourced values."""
        return self.bee_ld50.weighted_average()
