use super::constants::{
    BEE_DENSITY_PER_HA, BIRD_DENSITY_PER_HA, CROPLAND_AGE_YEARS, INSECT_DEATH_FRACTION,
    INSECT_DENSITY_PER_HA, MAMMAL_DENSITY_PER_HA, PASTURE_AGE_YEARS, REPTILE_DENSITY_PER_HA,
    SQUARE_METERS_PER_HA, WORM_DEATH_FRACTION, WORM_DENSITY_PER_HA,
};
use super::intelligence::{
    compute_intelligence, get_pesticide_victim_function, lifespan_years_for_slug, PesticideVictim,
};
use crate::models::{FoodRow, SentientHarmDetail, SliderQuery};

pub(in crate::calculations) fn compute_sentient_harm(
    food: &FoodRow,
    query: &SliderQuery,
) -> (f64, SentientHarmDetail) {
    let neuron_exp = query.neuron_exponent;
    let weight_exp = query.weight_exponent;
    let final_exp = query.final_intelligence_exponent;

    let intel = get_pesticide_victim_function(neuron_exp, weight_exp, final_exp);
    let insect_intel  = intel(PesticideVictim::Insect);
    let bee_intel     = intel(PesticideVictim::Bee);
    let worm_intel    = intel(PesticideVictim::Worm);
    let mammal_intel  = intel(PesticideVictim::Mammal);
    let bird_intel    = intel(PesticideVictim::Bird);
    let reptile_intel = intel(PesticideVictim::Reptile);

    if food.food_type == "plant" {
        return compute_plant_sentient_harm(
            food,
            insect_intel,
            bee_intel,
            worm_intel,
            mammal_intel,
            bird_intel,
            reptile_intel,
        );
    }

    compute_animal_sentient_harm(
        food,
        insect_intel,
        bee_intel,
        worm_intel,
        mammal_intel,
        bird_intel,
        reptile_intel,
        query,
    )
}

fn compute_plant_sentient_harm(
    food: &FoodRow,
    insect_intel: f64,
    bee_intel: f64,
    worm_intel: f64,
    mammal_intel: f64,
    bird_intel: f64,
    reptile_intel: f64,
) -> (f64, SentientHarmDetail) {
    let yield_kg_ha = match food.yield_kg_ha.filter(|&y| y > 0.0) {
        Some(y) => y,
        None => return (0.0, SentientHarmDetail::zero()),
    };

    let area_ha_per_kg = 1.0 / yield_kg_ha;

    let insect_deaths = food.pesticide_insect_paf.unwrap_or(0.0)
        * INSECT_DENSITY_PER_HA
        * area_ha_per_kg
        * INSECT_DEATH_FRACTION;
    let bee_deaths = food.pesticide_bee_hazard.unwrap_or(0.0)
        * BEE_DENSITY_PER_HA
        * area_ha_per_kg;
    let worm_deaths = food.pesticide_terrestrial_paf.unwrap_or(0.0)
        * WORM_DENSITY_PER_HA
        * area_ha_per_kg
        * WORM_DEATH_FRACTION;
    let mammal_deaths = MAMMAL_DENSITY_PER_HA * area_ha_per_kg / CROPLAND_AGE_YEARS;
    let bird_deaths = BIRD_DENSITY_PER_HA * area_ha_per_kg / CROPLAND_AGE_YEARS;
    let reptile_deaths = REPTILE_DENSITY_PER_HA * area_ha_per_kg / CROPLAND_AGE_YEARS;

    let insect_score = insect_deaths * insect_intel;
    let bee_score = bee_deaths * bee_intel;
    let worm_score = worm_deaths * worm_intel;
    let deforestation_score =
        mammal_deaths * mammal_intel + bird_deaths * bird_intel + reptile_deaths * reptile_intel;

    let total = sum_positive(&[
        insect_score,
        bee_score,
        worm_score,
        mammal_deaths * mammal_intel,
        bird_deaths * bird_intel,
        reptile_deaths * reptile_intel,
    ]);

    let detail = SentientHarmDetail {
        direct_kill_score: 0.0, // populated by mod.rs after compute_direct_kill
        insect_score,
        bee_score,
        worm_score,
        deforestation_score,
        feed_insect_score: 0.0,
        feed_bee_score: 0.0,
        feed_worm_score: 0.0,
        feed_deforestation_score: 0.0,
        pasture_deforestation_score: 0.0,
        bycatch_score: 0.0,
        captive_sentience_score: 0.0,
    };
    (total, detail)
}

fn compute_animal_sentient_harm(
    food: &FoodRow,
    insect_intel: f64,
    bee_intel: f64,
    worm_intel: f64,
    mammal_intel: f64,
    bird_intel: f64,
    reptile_intel: f64,
    query: &SliderQuery,
) -> (f64, SentientHarmDetail) {
    let mut contributions: Vec<f64> = Vec::new();
    let mut detail = SentientHarmDetail::zero();

    // Feed cropland impact — use actual feed land area (m² → ha) rather than a
    // pesticide-kg proxy, so insect/bee/deforestation deaths scale correctly with
    // the true land required for each feed crop.
    if let Some(feed_land_m2) = food.feed_land_m2_per_kg.filter(|&v| v > 0.0) {
        let feed_area = feed_land_m2 / SQUARE_METERS_PER_HA;

        let feed_insect_deaths = food.feed_pesticide_insect_paf.unwrap_or(0.0)
            * INSECT_DENSITY_PER_HA
            * feed_area
            * INSECT_DEATH_FRACTION;
        let feed_bee_deaths = food.feed_pesticide_bee_hazard.unwrap_or(0.0)
            * BEE_DENSITY_PER_HA
            * feed_area;
        let feed_worm_deaths = food.feed_pesticide_terrestrial_paf.unwrap_or(0.0)
            * WORM_DENSITY_PER_HA
            * feed_area
            * WORM_DEATH_FRACTION;
        let feed_mammal_deaths = MAMMAL_DENSITY_PER_HA * feed_area / CROPLAND_AGE_YEARS;
        let feed_bird_deaths = BIRD_DENSITY_PER_HA * feed_area / CROPLAND_AGE_YEARS;
        let feed_reptile_deaths = REPTILE_DENSITY_PER_HA * feed_area / CROPLAND_AGE_YEARS;

        detail.feed_insect_score = feed_insect_deaths * insect_intel;
        detail.feed_bee_score = feed_bee_deaths * bee_intel;
        detail.feed_worm_score = feed_worm_deaths * worm_intel;
        detail.feed_deforestation_score = feed_mammal_deaths * mammal_intel
            + feed_bird_deaths * bird_intel
            + feed_reptile_deaths * reptile_intel;

        contributions.push(detail.feed_insect_score);
        contributions.push(detail.feed_bee_score);
        contributions.push(detail.feed_worm_score);
        contributions.push(feed_mammal_deaths * mammal_intel);
        contributions.push(feed_bird_deaths * bird_intel);
        contributions.push(feed_reptile_deaths * reptile_intel);
    }

    // Pasture habitat impact
    if let Some(pasture_ha_per_kg) = food.pasture_ha_per_kg_output {
        let pasture_mammal_deaths = MAMMAL_DENSITY_PER_HA * pasture_ha_per_kg / PASTURE_AGE_YEARS;
        let pasture_bird_deaths = BIRD_DENSITY_PER_HA * pasture_ha_per_kg / PASTURE_AGE_YEARS;
        let pasture_reptile_deaths = REPTILE_DENSITY_PER_HA * pasture_ha_per_kg / PASTURE_AGE_YEARS;

        detail.pasture_deforestation_score = pasture_mammal_deaths * mammal_intel
            + pasture_bird_deaths * bird_intel
            + pasture_reptile_deaths * reptile_intel;

        contributions.push(pasture_mammal_deaths * mammal_intel);
        contributions.push(pasture_bird_deaths * bird_intel);
        contributions.push(pasture_reptile_deaths * reptile_intel);
    }

    // Bycatch
    if let (Some(bycatch_amount), Some(bycatch_neuron_count), Some(bycatch_weight_kg)) = (
        food.bycatch_amount.filter(|&a| a > 0.0),
        food.bycatch_neuron_count.filter(|&n| n > 0.0),
        food.bycatch_weight_kg.filter(|&w| w > 0.0),
    ) {
        let bycatch_lifespan = bycatch_lifespan_years(food.bycatch_food_slug.as_deref());
        let num_bycatch_individuals = bycatch_amount / bycatch_weight_kg;
        detail.bycatch_score = num_bycatch_individuals
            * compute_intelligence(
                bycatch_neuron_count,
                bycatch_weight_kg,
                bycatch_lifespan,
                query.neuron_exponent,
                query.weight_exponent,
                query.final_intelligence_exponent,
            );
        contributions.push(detail.bycatch_score);
    }

    let total = sum_positive(&contributions);
    (total, detail)
}

fn bycatch_lifespan_years(slug: Option<&str>) -> f64 {
    slug.map(lifespan_years_for_slug).unwrap_or(10.0)
}

fn sum_positive(values: &[f64]) -> f64 {
    values.iter().filter(|&&c| c > 0.0).sum()
}
