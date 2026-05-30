mod intelligence;

use crate::models::{FoodRow, LandUseDetail, SentientHarmDetail, SliderQuery};
use intelligence::{
    compute_intelligence, get_pesticide_victim_function, lifespan_years_for_slug, PesticideVictim,
};

// ── Eco constants (matching FoodTableCalculations.ts exactly) ─────────────────
const SQUARE_METERS_PER_HA: f64 = 10_000.0;

const INSECT_DENSITY_PER_HA: f64 = 1e9;
const INSECT_DEATH_FRACTION: f64 = 0.1;

const BEE_DENSITY_PER_HA: f64 = 5_000.0;
const BEE_HAZARD_MORTALITY: f64 = 0.5;

const WORM_DENSITY_PER_HA: f64 = 500_000.0;
const WORM_DEATH_FRACTION: f64 = 0.3;

const CROPLAND_AGE_YEARS: f64 = 50.0;
const PASTURE_AGE_YEARS: f64 = 30.0;

const MAMMAL_DENSITY_PER_HA: f64 = 50.0;
const BIRD_DENSITY_PER_HA: f64 = 5.0;
const REPTILE_DENSITY_PER_HA: f64 = 50.0;

// ── Land use ──────────────────────────────────────────────────────────────────

pub(super) fn compute_land_use(food: &FoodRow) -> (f64, LandUseDetail) {
    if food.food_type == "plant" {
        let land_use = food
            .yield_kg_ha
            .filter(|&y| y > 0.0)
            .map(|y| SQUARE_METERS_PER_HA / y)
            .unwrap_or(0.0);
        let detail = LandUseDetail {
            land_type: "plant".to_string(),
            yield_kilograms_per_hectare: food.yield_kg_ha,
            pasture_hectares_per_kilogram: None,
            feed_land_m2_per_kg: None,
        };
        return (land_use, detail);
    }

    let pasture_land_m2 = food
        .pasture_ha_per_kg_output
        .map(|ha| ha * SQUARE_METERS_PER_HA)
        .unwrap_or(0.0);
    let total = pasture_land_m2 + food.feed_land_m2_per_kg.unwrap_or(0.0);
    let detail = LandUseDetail {
        land_type: "animal".to_string(),
        yield_kilograms_per_hectare: None,
        pasture_hectares_per_kilogram: food.pasture_ha_per_kg_output,
        feed_land_m2_per_kg: food.feed_land_m2_per_kg,
    };
    (total, detail)
}

// ── Direct kill ───────────────────────────────────────────────────────────────

pub(super) fn compute_direct_kill(food: &FoodRow, query: &SliderQuery) -> f64 {
    let lifespan = lifespan_years_for_slug(&food.slug);

    if food.food_type != "animal" {
        return 0.0;
    }

    let (neuron_count, body_weight_kg, _yield_fraction) =
        match (food.neuron_count, food.weight_kg, food.yield_fraction) {
            (Some(n), Some(w), Some(y)) if n > 0.0 && w > 0.0 && y > 0.0 => (n, w, y),
            _ => return 0.0,
        };

    compute_intelligence(
        neuron_count,
        body_weight_kg,
        lifespan,
        query.neuron_exponent,
        query.weight_exponent,
        query.final_intelligence_exponent,
    )
}

// ── Sentient harm ─────────────────────────────────────────────────────────────

pub(super) fn compute_sentient_harm(
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
        * area_ha_per_kg
        * BEE_HAZARD_MORTALITY;
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
            * feed_area
            * BEE_HAZARD_MORTALITY;
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
