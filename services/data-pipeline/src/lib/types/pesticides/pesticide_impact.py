"""
pesticide_impact.py — combines a crop's pesticide applications into the fraction of
insects, bees, soil species and freshwater species they affect or kill.

PAF = Potentially Affected Fraction of species, a measure of ecotoxicity.
"""

import math

from .raw_pesticide import RawPesticide
from .raw_plant_pesticide import RawPlantPesticide


# Bee exposure and dose-response, from US EPA (2014) Guidance for Assessing Pesticide Risks
# to Bees (Tier I, foliar sprays). A forager eats 0.292 g/day of nectar and pollen holding
# up to 98 µg of pesticide per g for each kg a.i./ha sprayed, so it takes in 28.6 µg per
# kg/ha. That dose over the pesticide's oral LD50 is the risk quotient (RQ). EPA's level
# of concern RQ = 0.4 corresponds to 10% mortality on the median probit dose-response
# slope, which puts that slope at ~3.22 (probit 10% = -1.2816 = slope x log10 0.4).
BEE_ORAL_DOSE_UG_PER_KG_HA = 98 * 0.292
BEE_PROBIT_SLOPE = -1.2816 / math.log10(0.4)

# Application rate (kg active ingredient per ha) at which a pesticide's PAF is taken to
# apply. Each PAF is a per-compound toxicity index with no dose attached; scaling it by
# kg_ha / this rate makes a light spray count for less than a heavy one.
PAF_REFERENCE_KG_HA = 1.0


class PesticideAssociation:
    """Pairs a plant's pesticide usage record with its full pesticide data."""

    def __init__(self, plant_pesticide: RawPlantPesticide, pesticide: RawPesticide) -> None:
        self.plant_pesticide = plant_pesticide
        self.pesticide = pesticide


def pesticide_kg_per_kg_food(
    associations: list[PesticideAssociation], average_yield_kg_per_ha: float | None
) -> float | None:
    """Total pesticide kg applied per kg of food produced, weighted by yield."""
    if average_yield_kg_per_ha is None or average_yield_kg_per_ha <= 0:
        return None
    total_pesticide_kg_per_kg = sum(
        kg_per_ha / average_yield_kg_per_ha
        for association in associations
        if (kg_per_ha := association.plant_pesticide.kg_ha.weighted_average()) is not None
    )
    return total_pesticide_kg_per_kg or None


def dose_scaled_affected_fraction(
    associations: list[PesticideAssociation], paf_attribute_name: str
) -> float | None:
    """Combined fraction of species affected by all pesticides applied, scaled by dose.

    Each compound affects paf x (kg_ha / PAF_REFERENCE_KG_HA) of species, capped at 1,
    and compounds act independently: 1 - product of (1 - each fraction). This used to
    be a kg-weighted AVERAGE of the PAFs, which ignored how much was sprayed, so a crop
    with a light dose of one strong insecticide scored as high as one drenched in it.
    """
    surviving_fraction = 1.0
    found_any = False
    for association in associations:
        kg_per_ha = association.plant_pesticide.kg_ha.weighted_average()
        paf_value = getattr(association.pesticide, paf_attribute_name)
        if kg_per_ha is None or paf_value is None:
            continue
        found_any = True
        affected = min(1.0, paf_value * kg_per_ha / PAF_REFERENCE_KG_HA)
        surviving_fraction *= 1.0 - affected
    return 1.0 - surviving_fraction if found_any else None


def bee_mortality_fraction(associations: list[PesticideAssociation]) -> float | None:
    """Fraction of foraging bees on the crop killed by its pesticide applications (0-1).

    Each compound: RQ = 28.6 µg per kg/ha x kg_ha / oral LD50, mortality = probit curve
    at that RQ (50% at the LD50). Compounds act independently: 1 - product of survivals.
    Replaces a 'bee hazard' of kg_ha / (LD50 x bee weight) that counted lethal doses in
    the spray as bees killed, with no exposure step and no upper limit.
    """
    surviving_fraction = 1.0
    found_any = False
    for association in associations:
        kg_per_ha = association.plant_pesticide.kg_ha.weighted_average()
        bee_ld50 = association.pesticide.avg_bee_ld50
        if kg_per_ha is None or bee_ld50 is None or bee_ld50 <= 0:
            continue
        found_any = True
        if kg_per_ha <= 0:
            continue
        surviving_fraction *= 1.0 - _bee_mortality(kg_per_ha, bee_ld50)
    return 1.0 - surviving_fraction if found_any else None


def _bee_mortality(kg_per_ha: float, bee_ld50: float) -> float:
    """Fraction of bees killed by one compound sprayed at kg_per_ha."""
    risk_quotient = BEE_ORAL_DOSE_UG_PER_KG_HA * kg_per_ha / bee_ld50
    probit = BEE_PROBIT_SLOPE * math.log10(risk_quotient)
    return 0.5 * (1.0 + math.erf(probit / math.sqrt(2.0)))
