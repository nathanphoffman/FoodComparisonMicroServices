use crate::models::{EcoDestructionDetail, FoodRow, LandUseDetail};

// ── Eco destruction constants (matching FoodTableCalculations.ts exactly) ─────
const SQUARE_METERS_PER_HA: f64   = 10_000.0;
const NEURAL_EXPONENT: f64        = 1.5;

const INSECT_DENSITY_PER_HA: f64  = 1e9;
const INSECT_NEURONS: f64         = 1e6;
const INSECT_WEIGHT_KG: f64       = 1e-7;   // ~0.1 mg typical arthropod
const INSECT_DEATH_FRACTION: f64  = 0.1;
const INSECT_LIFESPAN_YEARS: f64  = 0.17;   // ~2 months

const BEE_DENSITY_PER_HA: f64    = 5_000.0;
const BEE_NEURONS: f64           = 960_000.0;
const BEE_WEIGHT_KG: f64         = 1e-4;    // ~100 mg honeybee
const BEE_HAZARD_MORTALITY: f64  = 0.5;
const BEE_LIFESPAN_YEARS: f64    = 0.08;    // ~4 weeks

const WORM_DENSITY_PER_HA: f64   = 500_000.0;
const WORM_NEURONS: f64          = 500.0;
const WORM_WEIGHT_KG: f64        = 3e-3;    // ~3 g earthworm
const WORM_DEATH_FRACTION: f64   = 0.3;
const WORM_LIFESPAN_YEARS: f64   = 5.0;

const CROPLAND_AGE_YEARS: f64    = 50.0;
const PASTURE_AGE_YEARS: f64     = 30.0;

const MAMMAL_DENSITY_PER_HA: f64 = 50.0;
const MAMMAL_NEURONS: f64        = 7e7;
const MAMMAL_WEIGHT_KG: f64      = 0.02;    // ~20 g mouse
const MAMMAL_LIFESPAN_YEARS: f64 = 2.5;

const BIRD_DENSITY_PER_HA: f64   = 10.0;
const BIRD_NEURONS: f64          = 1e8;
const BIRD_WEIGHT_KG: f64        = 0.05;    // ~50 g small bird
const BIRD_LIFESPAN_YEARS: f64   = 3.0;

const REPTILE_DENSITY_PER_HA: f64 = 50.0;
const REPTILE_NEURONS: f64        = 5e5;
const REPTILE_WEIGHT_KG: f64      = 0.05;   // ~50 g small lizard
const REPTILE_LIFESPAN_YEARS: f64 = 4.0;

const REF_FEED_PESTICIDE_KG_HA: f64 = 2.0;

// Per-organism intelligence scores (precomputed at compile time as lazy statics
// would require a crate; compute once in fn since they're constant expressions).
fn insect_per_org()  -> f64 { INSECT_NEURONS.powf(NEURAL_EXPONENT)  * INSECT_LIFESPAN_YEARS  / INSECT_WEIGHT_KG.powf(0.75) }
fn bee_per_org()     -> f64 { BEE_NEURONS.powf(NEURAL_EXPONENT)     * BEE_LIFESPAN_YEARS     / BEE_WEIGHT_KG }
fn worm_per_org()    -> f64 { WORM_NEURONS.powf(NEURAL_EXPONENT)    * WORM_LIFESPAN_YEARS    / WORM_WEIGHT_KG }
fn mammal_per_org()  -> f64 { MAMMAL_NEURONS.powf(NEURAL_EXPONENT)  * MAMMAL_LIFESPAN_YEARS  / MAMMAL_WEIGHT_KG }
fn bird_per_org()    -> f64 { BIRD_NEURONS.powf(NEURAL_EXPONENT)    * BIRD_LIFESPAN_YEARS    / BIRD_WEIGHT_KG }
fn reptile_per_org() -> f64 { REPTILE_NEURONS.powf(NEURAL_EXPONENT) * REPTILE_LIFESPAN_YEARS / REPTILE_WEIGHT_KG }

// ── Land use ──────────────────────────────────────────────────────────────────

pub(super) fn compute_land_use(food: &FoodRow) -> (f64, LandUseDetail) {
    if food.food_type == "plant" {
        let land_use = food.yield_kg_ha
            .filter(|&y| y > 0.0)
            .map(|y| SQUARE_METERS_PER_HA / y)
            .unwrap_or(0.0);
        let detail = LandUseDetail {
            land_type:                     "plant".to_string(),
            yield_kilograms_per_hectare:   food.yield_kg_ha,
            pasture_hectares_per_kilogram: None,
            feed_land_m2_per_kg:           None,
        };
        return (land_use, detail);
    }

    let pasture_land_m2 = food.pasture_ha_per_kg_output
        .map(|ha| ha * SQUARE_METERS_PER_HA)
        .unwrap_or(0.0);
    let total  = pasture_land_m2 + food.feed_land_m2_per_kg.unwrap_or(0.0);
    let detail = LandUseDetail {
        land_type:                     "animal".to_string(),
        yield_kilograms_per_hectare:   None,
        pasture_hectares_per_kilogram: food.pasture_ha_per_kg_output,
        feed_land_m2_per_kg:           food.feed_land_m2_per_kg,
    };
    (total, detail)
}

// ── Direct kill ───────────────────────────────────────────────────────────────

pub(super) fn compute_direct_kill(food: &FoodRow) -> f64 {
    let lifespan = match food.slug.as_str() {
        "beef"     => 20.0,
        "chicken"  =>  8.0,
        "pork"     => 12.0,
        "turkey"   => 10.0,
        "lamb"     => 12.0,
        "milk"     => 20.0,
        "yogurt"   => 20.0,
        "egg"      =>  8.0,
        "salmon"   =>  6.0,
        "tuna"     => 20.0,
        "shrimp"   =>  2.0,
        "sardines" =>  4.0,
        _          => 10.0,
    };

    if food.food_type != "animal" {
        return 0.0;
    }
    let (neuron_count, body_weight_kg, yield_fraction) = match (
        food.neuron_count,
        food.weight_kg,
        food.yield_fraction,
    ) {
        (Some(n), Some(w), Some(y)) if n > 0.0 && w > 0.0 && y > 0.0 => (n, w, y),
        _ => return 0.0,
    };

    let neuron_score = neuron_count.powf(NEURAL_EXPONENT);
    let edible_mass  = body_weight_kg * yield_fraction;
    neuron_score * lifespan / edible_mass
}

// ── Eco destruction ───────────────────────────────────────────────────────────

fn combine_contributions(contributions: &[f64]) -> f64 {
    let sum: f64 = contributions.iter()
        .filter(|&&c| c > 0.0)
        .map(|&c| c.powf(2.0 / 3.0))
        .sum();
    sum.powf(1.5)
}

pub(super) fn compute_eco_destruction(food: &FoodRow) -> (f64, EcoDestructionDetail) {
    let insect_intel  = insect_per_org();
    let bee_intel     = bee_per_org();
    let worm_intel    = worm_per_org();
    let mammal_intel  = mammal_per_org();
    let bird_intel    = bird_per_org();
    let reptile_intel = reptile_per_org();

    if food.food_type == "plant" {
        return compute_plant_eco_destruction(
            food,
            insect_intel, bee_intel, worm_intel,
            mammal_intel, bird_intel, reptile_intel,
        );
    }

    compute_animal_eco_destruction(
        food,
        insect_intel, bee_intel, worm_intel,
        mammal_intel, bird_intel, reptile_intel,
    )
}

fn compute_plant_eco_destruction(
    food: &FoodRow,
    insect_intel: f64, bee_intel: f64, worm_intel: f64,
    mammal_intel: f64, bird_intel: f64, reptile_intel: f64,
) -> (f64, EcoDestructionDetail) {
    let yield_kg_ha = match food.yield_kg_ha.filter(|&y| y > 0.0) {
        Some(y) => y,
        None    => return (0.0, EcoDestructionDetail::zero()),
    };

    let area_ha_per_kg = 1.0 / yield_kg_ha;

    let insect_deaths  = food.pesticide_insect_paf.unwrap_or(0.0)      * INSECT_DENSITY_PER_HA * area_ha_per_kg * INSECT_DEATH_FRACTION;
    let bee_deaths     = food.pesticide_bee_hazard.unwrap_or(0.0)      * BEE_DENSITY_PER_HA    * area_ha_per_kg * BEE_HAZARD_MORTALITY;
    let worm_deaths    = food.pesticide_terrestrial_paf.unwrap_or(0.0) * WORM_DENSITY_PER_HA   * area_ha_per_kg * WORM_DEATH_FRACTION;
    let mammal_deaths  = MAMMAL_DENSITY_PER_HA  * area_ha_per_kg / CROPLAND_AGE_YEARS;
    let bird_deaths    = BIRD_DENSITY_PER_HA    * area_ha_per_kg / CROPLAND_AGE_YEARS;
    let reptile_deaths = REPTILE_DENSITY_PER_HA * area_ha_per_kg / CROPLAND_AGE_YEARS;

    let insect_score       = insect_deaths  * insect_intel;
    let bee_score          = bee_deaths     * bee_intel;
    let worm_score         = worm_deaths    * worm_intel;
    let deforestation_score = mammal_deaths * mammal_intel
                            + bird_deaths   * bird_intel
                            + reptile_deaths * reptile_intel;

    let total = combine_contributions(&[
        insect_score, bee_score, worm_score,
        mammal_deaths * mammal_intel,
        bird_deaths   * bird_intel,
        reptile_deaths * reptile_intel,
    ]);

    let detail = EcoDestructionDetail {
        insect_score, bee_score, worm_score, deforestation_score,
        feed_insect_score: 0.0, feed_bee_score: 0.0, feed_worm_score: 0.0,
        feed_deforestation_score: 0.0, pasture_deforestation_score: 0.0, bycatch_score: 0.0,
    };
    (total, detail)
}

fn compute_animal_eco_destruction(
    food: &FoodRow,
    insect_intel: f64, bee_intel: f64, worm_intel: f64,
    mammal_intel: f64, bird_intel: f64, reptile_intel: f64,
) -> (f64, EcoDestructionDetail) {
    let mut contributions: Vec<f64> = Vec::new();
    let mut detail = EcoDestructionDetail::zero();

    // Feed cropland impact
    if let Some(feed_pesticide_kg) = food.feed_pesticide_kg_per_kg_food.filter(|&v| v > 0.0) {
        let feed_area = feed_pesticide_kg / REF_FEED_PESTICIDE_KG_HA;

        let feed_insect_deaths  = food.feed_pesticide_insect_paf.unwrap_or(0.0)      * INSECT_DENSITY_PER_HA * feed_area * INSECT_DEATH_FRACTION;
        let feed_bee_deaths     = food.feed_pesticide_bee_hazard.unwrap_or(0.0)      * BEE_DENSITY_PER_HA    * feed_area * BEE_HAZARD_MORTALITY;
        let feed_worm_deaths    = food.feed_pesticide_terrestrial_paf.unwrap_or(0.0) * WORM_DENSITY_PER_HA   * feed_area * WORM_DEATH_FRACTION;
        let feed_mammal_deaths  = MAMMAL_DENSITY_PER_HA  * feed_area / CROPLAND_AGE_YEARS;
        let feed_bird_deaths    = BIRD_DENSITY_PER_HA    * feed_area / CROPLAND_AGE_YEARS;
        let feed_reptile_deaths = REPTILE_DENSITY_PER_HA * feed_area / CROPLAND_AGE_YEARS;

        detail.feed_insect_score        = feed_insect_deaths  * insect_intel;
        detail.feed_bee_score           = feed_bee_deaths     * bee_intel;
        detail.feed_worm_score          = feed_worm_deaths    * worm_intel;
        detail.feed_deforestation_score = feed_mammal_deaths  * mammal_intel
                                        + feed_bird_deaths    * bird_intel
                                        + feed_reptile_deaths * reptile_intel;

        contributions.push(detail.feed_insect_score);
        contributions.push(detail.feed_bee_score);
        contributions.push(detail.feed_worm_score);
        contributions.push(feed_mammal_deaths  * mammal_intel);
        contributions.push(feed_bird_deaths    * bird_intel);
        contributions.push(feed_reptile_deaths * reptile_intel);
    }

    // Pasture habitat impact
    if let Some(pasture_ha_per_kg) = food.pasture_ha_per_kg_output {
        let pasture_mammal_deaths  = MAMMAL_DENSITY_PER_HA  * pasture_ha_per_kg / PASTURE_AGE_YEARS;
        let pasture_bird_deaths    = BIRD_DENSITY_PER_HA    * pasture_ha_per_kg / PASTURE_AGE_YEARS;
        let pasture_reptile_deaths = REPTILE_DENSITY_PER_HA * pasture_ha_per_kg / PASTURE_AGE_YEARS;

        detail.pasture_deforestation_score = pasture_mammal_deaths  * mammal_intel
                                           + pasture_bird_deaths    * bird_intel
                                           + pasture_reptile_deaths * reptile_intel;

        contributions.push(pasture_mammal_deaths  * mammal_intel);
        contributions.push(pasture_bird_deaths    * bird_intel);
        contributions.push(pasture_reptile_deaths * reptile_intel);
    }

    // Bycatch
    if let (Some(bycatch_amount), Some(bycatch_neuron_count), Some(bycatch_weight_kg)) = (
        food.bycatch_amount.filter(|&a| a > 0.0),
        food.bycatch_neuron_count.filter(|&n| n > 0.0),
        food.bycatch_weight_kg.filter(|&w| w > 0.0),
    ) {
        let bycatch_lifespan     = bycatch_lifespan_years(food.bycatch_food_slug.as_deref());
        let bycatch_individuals  = bycatch_amount / bycatch_weight_kg;
        let bycatch_neuron_score = bycatch_neuron_count.powf(NEURAL_EXPONENT);
        detail.bycatch_score     = bycatch_individuals * bycatch_neuron_score * bycatch_lifespan;
        contributions.push(detail.bycatch_score);
    }

    let total = combine_contributions(&contributions);
    (total, detail)
}

fn bycatch_lifespan_years(slug: Option<&str>) -> f64 {
    match slug {
        Some("beef")     => 20.0,
        Some("chicken")  =>  8.0,
        Some("pork")     => 12.0,
        Some("turkey")   => 10.0,
        Some("lamb")     => 12.0,
        Some("milk")     => 20.0,
        Some("yogurt")   => 20.0,
        Some("egg")      =>  8.0,
        Some("salmon")   =>  6.0,
        Some("tuna")     => 20.0,
        Some("shrimp")   =>  2.0,
        Some("sardines") =>  4.0,
        _                => 10.0,
    }
}
