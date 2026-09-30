use super::super::constants::{
    BEE_DENSITY_PER_HA, BIRD_DENSITY_PER_HA, CROPLAND_AGE_YEARS, INSECT_DEATH_FRACTION,
    INSECT_DENSITY_PER_HA, MAMMAL_DENSITY_PER_HA, REPTILE_DENSITY_PER_HA, WORM_DEATH_FRACTION,
    WORM_DENSITY_PER_HA,
};
use super::super::intelligence::{get_pesticide_victim_function, PesticideVictim};
use crate::models::SliderQuery;

/// Intelligence score of one death of each wild victim type, for the current sliders.
pub(super) struct VictimIntelligence {
    insect:  f64,
    bee:     f64,
    worm:    f64,
    mammal:  f64,
    bird:    f64,
    reptile: f64,
}

impl VictimIntelligence {
    pub(super) fn from_query(query: &SliderQuery) -> Self {
        let intel = get_pesticide_victim_function(
            query.neuron_exponent,
            query.weight_exponent,
            query.final_intelligence_exponent,
        );
        Self {
            insect:  intel(PesticideVictim::Insect),
            bee:     intel(PesticideVictim::Bee),
            worm:    intel(PesticideVictim::Worm),
            mammal:  intel(PesticideVictim::Mammal),
            bird:    intel(PesticideVictim::Bird),
            reptile: intel(PesticideVictim::Reptile),
        }
    }
}

/// Pesticide kill rates for one crop (or an animal's feed crops).
pub(super) struct PesticideRates {
    pub(super) insect_paf:      Option<f64>,
    pub(super) bee_hazard:      Option<f64>,
    pub(super) terrestrial_paf: Option<f64>,
}

/// Intelligence-weighted deaths caused by using an area of land, per victim type.
pub(super) struct LandHarm {
    pub(super) insect:  f64,
    pub(super) bee:     f64,
    pub(super) worm:    f64,
    pub(super) mammal:  f64,
    pub(super) bird:    f64,
    pub(super) reptile: f64,
}

impl LandHarm {
    /// Cropland: pesticide deaths (insects, bees, soil organisms) plus the wildlife
    /// displaced by clearing the land, amortized over CROPLAND_AGE_YEARS.
    pub(super) fn cropland(area_ha: f64, pesticides: &PesticideRates, intel: &VictimIntelligence) -> Self {
        let insect_deaths = pesticides.insect_paf.unwrap_or(0.0)
            * INSECT_DENSITY_PER_HA
            * area_ha
            * INSECT_DEATH_FRACTION;
        let bee_deaths = pesticides.bee_hazard.unwrap_or(0.0)
            * BEE_DENSITY_PER_HA
            * area_ha;
        let worm_deaths = pesticides.terrestrial_paf.unwrap_or(0.0)
            * WORM_DENSITY_PER_HA
            * area_ha
            * WORM_DEATH_FRACTION;

        Self {
            insect: insect_deaths * intel.insect,
            bee:    bee_deaths * intel.bee,
            worm:   worm_deaths * intel.worm,
            ..Self::habitat_loss(area_ha, CROPLAND_AGE_YEARS, intel)
        }
    }

    /// Wildlife (mammals, birds, reptiles) displaced by clearing the land,
    /// amortized over how long the land stays in use. No pesticide deaths.
    pub(super) fn habitat_loss(area_ha: f64, land_age_years: f64, intel: &VictimIntelligence) -> Self {
        let mammal_deaths  = MAMMAL_DENSITY_PER_HA  * area_ha / land_age_years;
        let bird_deaths    = BIRD_DENSITY_PER_HA    * area_ha / land_age_years;
        let reptile_deaths = REPTILE_DENSITY_PER_HA * area_ha / land_age_years;

        Self {
            insect:  0.0,
            bee:     0.0,
            worm:    0.0,
            mammal:  mammal_deaths * intel.mammal,
            bird:    bird_deaths * intel.bird,
            reptile: reptile_deaths * intel.reptile,
        }
    }

    pub(super) fn deforestation(&self) -> f64 {
        self.mammal + self.bird + self.reptile
    }

    /// Every victim type's score, in a fixed order, for summing into the total.
    pub(super) fn parts(&self) -> [f64; 6] {
        [self.insect, self.bee, self.worm, self.mammal, self.bird, self.reptile]
    }
}
