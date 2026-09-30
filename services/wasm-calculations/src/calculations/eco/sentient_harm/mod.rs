//! Accidental harm: animals killed as a side effect of producing food —
//! pesticides, land clearing and bycatch. Direct kill and captivity live in
//! direct_kill.rs.

mod bycatch;
mod land_harm;

use super::constants::{PASTURE_AGE_YEARS, SQUARE_METERS_PER_HA};
use crate::models::{FoodRow, SentientHarmDetail, SliderQuery};
use bycatch::bycatch_score;
use land_harm::{LandHarm, PesticideRates, VictimIntelligence};

/// Returns (total accidental harm, per-source detail). The detail's direct kill and
/// captivity scores are left at 0 — row.rs fills them in.
pub(in crate::calculations) fn compute_sentient_harm(
    food: &FoodRow,
    query: &SliderQuery,
) -> (f64, SentientHarmDetail) {
    let intel = VictimIntelligence::from_query(query);
    if food.food_type == "plant" {
        plant_sentient_harm(food, &intel)
    } else {
        animal_sentient_harm(food, &intel, query)
    }
}

/// A plant's own cropland: pesticide deaths plus habitat loss.
fn plant_sentient_harm(food: &FoodRow, intel: &VictimIntelligence) -> (f64, SentientHarmDetail) {
    let Some(yield_kg_ha) = food.yield_kg_ha.filter(|&y| y > 0.0) else {
        return (0.0, SentientHarmDetail::zero());
    };

    let pesticides = PesticideRates {
        insect_paf:      food.pesticide_insect_paf,
        bee_hazard:      food.pesticide_bee_hazard,
        terrestrial_paf: food.pesticide_terrestrial_paf,
    };
    let crop = LandHarm::cropland(1.0 / yield_kg_ha, &pesticides, intel);

    let detail = SentientHarmDetail {
        insect_score:        crop.insect,
        bee_score:           crop.bee,
        worm_score:          crop.worm,
        deforestation_score: crop.deforestation(),
        ..SentientHarmDetail::zero()
    };
    (sum_positive(&crop.parts()), detail)
}

/// An animal's feed cropland, its pasture, and any bycatch.
fn animal_sentient_harm(
    food: &FoodRow,
    intel: &VictimIntelligence,
    query: &SliderQuery,
) -> (f64, SentientHarmDetail) {
    let mut contributions: Vec<f64> = Vec::new();
    let mut detail = SentientHarmDetail::zero();

    // Feed cropland impact — use actual feed land area (m² → ha) rather than a
    // pesticide-kg proxy, so insect/bee/deforestation deaths scale correctly with
    // the true land required for each feed crop.
    if let Some(feed_land_m2) = food.feed_land_m2_per_kg.filter(|&v| v > 0.0) {
        let pesticides = PesticideRates {
            insect_paf:      food.feed_pesticide_insect_paf,
            bee_hazard:      food.feed_pesticide_bee_hazard,
            terrestrial_paf: food.feed_pesticide_terrestrial_paf,
        };
        let feed = LandHarm::cropland(feed_land_m2 / SQUARE_METERS_PER_HA, &pesticides, intel);

        detail.feed_insect_score        = feed.insect;
        detail.feed_bee_score           = feed.bee;
        detail.feed_worm_score          = feed.worm;
        detail.feed_deforestation_score = feed.deforestation();
        contributions.extend(feed.parts());
    }

    // Pasture habitat impact
    if let Some(pasture_ha_per_kg) = food.pasture_ha_per_kg_output {
        let pasture = LandHarm::habitat_loss(pasture_ha_per_kg, PASTURE_AGE_YEARS, intel);
        detail.pasture_deforestation_score = pasture.deforestation();
        contributions.extend(pasture.parts());
    }

    if let Some(score) = bycatch_score(food, query) {
        detail.bycatch_score = score;
        contributions.push(score);
    }

    (sum_positive(&contributions), detail)
}

fn sum_positive(values: &[f64]) -> f64 {
    values.iter().filter(|&&c| c > 0.0).sum()
}
