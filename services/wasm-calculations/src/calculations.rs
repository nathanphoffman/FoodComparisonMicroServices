/// Pure Rust port of FoodTableCalculations.ts (runtime calculation portions).
/// All functions are free of I/O and WASM-bindgen concerns.
use crate::models::{Averages, FoodRow, ScoredRow, SliderQuery};

const CALORIE_NORM: f64          = 1_000.0; // kcal/kg basis
const PROTEIN_NORM: f64          = 100.0;   // g/kg basis
const SQUARE_METERS_PER_HA: f64  = 10_000.0;
const FIBER_SCORE_WEIGHT: f64    = 2.0;
const SAT_FAT_SCORE_PENALTY: f64 = 2.0;
const NUTRITION_SCORE_SCALE: f64 = 100.0;
const NEURAL_EXPONENT: f64       = 1.5;

// ── GWP conversion factors (matching FoodTableCalculations.ts) ────────────────
const GWP_CH4: f64 = 28.0;
const GWP_N2O: f64 = 265.0;

// ── Eco destruction constants (matching FoodTableCalculations.ts exactly) ─────
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
// Note: insects use weight^0.75 as denominator, matching the TS comment:
// "Taking ^(2/3) undoes the ^1.5 so types are additive"
fn insect_per_org() -> f64 { INSECT_NEURONS.powf(NEURAL_EXPONENT) * INSECT_LIFESPAN_YEARS / INSECT_WEIGHT_KG.powf(0.75) }
fn bee_per_org()    -> f64 { BEE_NEURONS.powf(NEURAL_EXPONENT)    * BEE_LIFESPAN_YEARS    / BEE_WEIGHT_KG }
fn worm_per_org()   -> f64 { WORM_NEURONS.powf(NEURAL_EXPONENT)   * WORM_LIFESPAN_YEARS   / WORM_WEIGHT_KG }
fn mammal_per_org() -> f64 { MAMMAL_NEURONS.powf(NEURAL_EXPONENT) * MAMMAL_LIFESPAN_YEARS / MAMMAL_WEIGHT_KG }
fn bird_per_org()   -> f64 { BIRD_NEURONS.powf(NEURAL_EXPONENT)   * BIRD_LIFESPAN_YEARS   / BIRD_WEIGHT_KG }
fn reptile_per_org()-> f64 { REPTILE_NEURONS.powf(NEURAL_EXPONENT)* REPTILE_LIFESPAN_YEARS/ REPTILE_WEIGHT_KG }

// ── Entry point ──────────────────────────────────────────────────────────────

pub fn apply(foods: Vec<FoodRow>, q: &SliderQuery) -> Vec<ScoredRow> {
    let mut rows: Vec<ScoredRow> = foods.iter().map(|f| compute_row(f, q)).collect();
    let avgs = compute_averages(&rows);
    for row in &mut rows {
        row.final_score = compute_final_score(row, &avgs);
    }
    rows
}

// ── Per-food computation ─────────────────────────────────────────────────────

fn compute_row(food: &FoodRow, q: &SliderQuery) -> ScoredRow {
    let divisor = compute_divisor(food, q);

    let nutrition_score = if food.calories > 0.0 {
        let raw = food.protein
            + FIBER_SCORE_WEIGHT * food.fiber
            - SAT_FAT_SCORE_PENALTY * food.sat_fat;
        Some(raw / food.calories * NUTRITION_SCORE_SCALE / divisor)
    } else {
        None
    };

    let emissions_raw    = compute_emissions(food)      / divisor;
    let land_use_raw     = compute_land_use(food)       / divisor;
    let water_raw        = effective_water(food, q)     / divisor;
    let kill_raw         = compute_direct_kill(food)    / divisor;
    // kill_multiplier is a divisor on eco destruction, matching TS philosophicalKill usage:
    // ecoDestruction / d / philosophicalKill
    let eco_raw          = compute_eco_destruction(food) / divisor / q.kill_multiplier;

    ScoredRow {
        name:            food.name.clone(),
        slug:            food.slug.clone(),
        food_type:       food.food_type.clone(),
        nutrition_score,
        emissions:       if emissions_raw > 0.0 { Some(emissions_raw) } else { None },
        land_use:        if land_use_raw  > 0.0 { Some(land_use_raw)  } else { None },
        water:           if water_raw     > 0.0 { Some(water_raw)     } else { None },
        direct_kill:     if kill_raw      > 0.0 { Some(kill_raw)      } else { None },
        eco_destruction: if eco_raw       > 0.0 { Some(eco_raw)       } else { None },
        final_score:     None, // filled in by apply()
    }
}

// ── Divisor (unit normalisation) ─────────────────────────────────────────────

fn compute_divisor(food: &FoodRow, q: &SliderQuery) -> f64 {
    let calories_per_kg = food.calories * 1_000.0;
    let protein_per_kg  = food.protein  * 1_000.0;
    let d = (q.mass_weight    / 100.0) * 1.0
          + (q.calorie_weight / 100.0) * (calories_per_kg / CALORIE_NORM)
          + (q.protein_weight / 100.0) * (protein_per_kg  / PROTEIN_NORM);
    if d > 0.0 { d } else { 1.0 }
}

// ── Individual metrics ────────────────────────────────────────────────────────

fn compute_emissions(food: &FoodRow) -> f64 {
    if food.food_type == "animal" {
        if let (Some(ch4), Some(n2o), Some(co2)) = (
            food.ch4_kg_per_kg_output,
            food.n2o_kg_per_kg_output,
            food.co2_kg_per_kg_output,
        ) {
            // Apply GWP factors to get CO₂e, matching FoodTableCalculations.ts:
            // ch4Co2e = ch4 * 28, n2oCo2e = n2o * 265
            return co2
                + ch4 * GWP_CH4
                + n2o * GWP_N2O
                + food.feed_emissions_per_kg.unwrap_or(0.0);
        }
    }
    food.emissions_per_kg.unwrap_or(0.0)
}

fn compute_land_use(food: &FoodRow) -> f64 {
    if food.food_type == "plant" {
        return food.yield_kg_ha
            .filter(|&y| y > 0.0)
            .map(|y| SQUARE_METERS_PER_HA / y)
            .unwrap_or(0.0);
    }
    let pasture = food.pasture_ha_per_kg_output
        .map(|ha| ha * SQUARE_METERS_PER_HA)
        .unwrap_or(0.0);
    pasture + food.feed_land_m2_per_kg.unwrap_or(0.0)
}

fn effective_water(food: &FoodRow, q: &SliderQuery) -> f64 {
    let (green, blue, grey) = if food.food_type == "animal" {
        (food.feed_green_water_per_kg, food.feed_blue_water_per_kg, food.feed_grey_water_per_kg)
    } else {
        (food.green_water_per_kg, food.blue_water_per_kg, food.grey_water_per_kg)
    };

    if let (Some(g), Some(b)) = (green, blue) {
        return b
            + (q.green_water / 100.0) * g
            + (q.grey_water  / 100.0) * grey.unwrap_or(0.0);
    }

    if food.food_type == "animal" {
        food.feed_water_per_kg.unwrap_or(0.0)
    } else {
        food.water_per_kg.unwrap_or(0.0)
    }
}

fn compute_direct_kill(food: &FoodRow) -> f64 {
    // Per-species natural lifespan (years), matching LIFESPAN_YEARS_BY_SLUG in TS
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
        _          => 10.0, // DEFAULT_LIFESPAN_YEARS
    };

    if food.food_type != "animal" {
        return 0.0;
    }
    let (neurons, weight, yield_frac) = match (
        food.neuron_count,
        food.weight_kg,
        food.yield_fraction,
    ) {
        (Some(n), Some(w), Some(y)) if n > 0.0 && w > 0.0 && y > 0.0 => (n, w, y),
        _ => return 0.0,
    };

    let neuron_score = neurons.powf(NEURAL_EXPONENT);
    let edible_mass  = weight * yield_frac;
    neuron_score * lifespan / edible_mass
    // Note: kill_multiplier is NOT applied here — it is applied to eco_destruction
    // as a divisor in compute_row, matching the TS philosophicalKill behaviour.
}

// ── Eco destruction ───────────────────────────────────────────────────────────
// Port of computeEcoDestruction() from FoodTableCalculations.ts.

fn combine_contribs(contribs: &[f64]) -> f64 {
    // Each contribution raised to 2/3 makes them additive, then ^1.5 re-applies scaling.
    let sum: f64 = contribs.iter()
        .filter(|&&c| c > 0.0)
        .map(|&c| c.powf(2.0 / 3.0))
        .sum();
    sum.powf(1.5)
}

fn compute_eco_destruction(food: &FoodRow) -> f64 {
    let ipo = insect_per_org();
    let bpo = bee_per_org();
    let wpo = worm_per_org();
    let mpo = mammal_per_org();
    let brd = bird_per_org();
    let rpo = reptile_per_org();

    if food.food_type == "plant" {
        let yield_kg_ha = match food.yield_kg_ha.filter(|&y| y > 0.0) {
            Some(y) => y,
            None    => return 0.0,
        };

        let area_ha_per_kg = 1.0 / yield_kg_ha;

        let insect_deaths  = food.pesticide_insect_paf.unwrap_or(0.0)      * INSECT_DENSITY_PER_HA * area_ha_per_kg * INSECT_DEATH_FRACTION;
        let bee_deaths     = food.pesticide_bee_hazard.unwrap_or(0.0)      * BEE_DENSITY_PER_HA    * area_ha_per_kg * BEE_HAZARD_MORTALITY;
        let worm_deaths    = food.pesticide_terrestrial_paf.unwrap_or(0.0) * WORM_DENSITY_PER_HA   * area_ha_per_kg * WORM_DEATH_FRACTION;
        let mammal_deaths  = MAMMAL_DENSITY_PER_HA  * area_ha_per_kg / CROPLAND_AGE_YEARS;
        let bird_deaths    = BIRD_DENSITY_PER_HA    * area_ha_per_kg / CROPLAND_AGE_YEARS;
        let reptile_deaths = REPTILE_DENSITY_PER_HA * area_ha_per_kg / CROPLAND_AGE_YEARS;

        return combine_contribs(&[
            insect_deaths  * ipo,
            bee_deaths     * bpo,
            worm_deaths    * wpo,
            mammal_deaths  * mpo,
            bird_deaths    * brd,
            reptile_deaths * rpo,
        ]);
    }

    // Animal — feed cropland + pasture contributions
    let mut contribs: Vec<f64> = Vec::new();

    if let Some(feed_pstc) = food.feed_pesticide_kg_per_kg_food.filter(|&v| v > 0.0) {
        let feed_area = feed_pstc / REF_FEED_PESTICIDE_KG_HA;

        let fi_deaths = food.feed_pesticide_insect_paf.unwrap_or(0.0)      * INSECT_DENSITY_PER_HA * feed_area * INSECT_DEATH_FRACTION;
        let fb_deaths = food.feed_pesticide_bee_hazard.unwrap_or(0.0)      * BEE_DENSITY_PER_HA    * feed_area * BEE_HAZARD_MORTALITY;
        let fw_deaths = food.feed_pesticide_terrestrial_paf.unwrap_or(0.0) * WORM_DENSITY_PER_HA   * feed_area * WORM_DEATH_FRACTION;
        let fm_deaths = MAMMAL_DENSITY_PER_HA  * feed_area / CROPLAND_AGE_YEARS;
        let fbd_deaths= BIRD_DENSITY_PER_HA    * feed_area / CROPLAND_AGE_YEARS;
        let fr_deaths = REPTILE_DENSITY_PER_HA * feed_area / CROPLAND_AGE_YEARS;

        contribs.push(fi_deaths  * ipo);
        contribs.push(fb_deaths  * bpo);
        contribs.push(fw_deaths  * wpo);
        contribs.push(fm_deaths  * mpo);
        contribs.push(fbd_deaths * brd);
        contribs.push(fr_deaths  * rpo);
    }

    if let Some(pasture) = food.pasture_ha_per_kg_output {
        let pm_deaths = MAMMAL_DENSITY_PER_HA  * pasture / PASTURE_AGE_YEARS;
        let pb_deaths = BIRD_DENSITY_PER_HA    * pasture / PASTURE_AGE_YEARS;
        let pr_deaths = REPTILE_DENSITY_PER_HA * pasture / PASTURE_AGE_YEARS;

        contribs.push(pm_deaths * mpo);
        contribs.push(pb_deaths * brd);
        contribs.push(pr_deaths * rpo);
    }

    combine_contribs(&contribs)
}

// ── Relative scoring ──────────────────────────────────────────────────────────

pub fn compute_averages(rows: &[ScoredRow]) -> Averages {
    Averages {
        emissions:       avg(rows, |r| r.emissions),
        land_use:        avg(rows, |r| r.land_use),
        water:           avg(rows, |r| r.water),
        direct_kill:     avg(rows, |r| r.direct_kill),
        nutrition_score: avg(rows, |r| r.nutrition_score),
        eco_destruction: avg(rows, |r| r.eco_destruction),
    }
}

fn avg(rows: &[ScoredRow], sel: impl Fn(&ScoredRow) -> Option<f64>) -> Option<f64> {
    let vals: Vec<f64> = rows.iter().filter_map(sel).collect();
    if vals.is_empty() { None } else { Some(vals.iter().sum::<f64>() / vals.len() as f64) }
}

pub fn compute_final_score(row: &ScoredRow, avgs: &Averages) -> Option<f64> {
    let mut scores = Vec::new();

    if let (Some(v), Some(a)) = (row.nutrition_score, avgs.nutrition_score) {
        scores.push(dimension_score(v, a, false));
    }
    if let (Some(v), Some(a)) = (row.emissions, avgs.emissions) {
        scores.push(dimension_score(v, a, true));
    }
    if let (Some(v), Some(a)) = (row.land_use, avgs.land_use) {
        scores.push(dimension_score(v, a, true));
    }
    if let (Some(v), Some(a)) = (row.water, avgs.water) {
        scores.push(dimension_score(v, a, true));
    }
    if let (Some(v), Some(a)) = (row.direct_kill, avgs.direct_kill) {
        scores.push(dimension_score(v, a, true));
    }
    if let (Some(v), Some(a)) = (row.eco_destruction, avgs.eco_destruction) {
        scores.push(dimension_score(v, a, true));
    }

    if scores.is_empty() {
        return None;
    }
    let mean = scores.iter().sum::<f64>() / scores.len() as f64;
    Some(mean.clamp(0.0, 100.0))
}

fn dimension_score(value: f64, avg: f64, lower_is_better: bool) -> f64 {
    if avg <= 0.0 || value <= 0.0 {
        return 50.0;
    }
    let raw = if lower_is_better {
        50.0 * (avg / value)
    } else {
        50.0 * (value / avg)
    };
    raw.clamp(0.0, 100.0)
}
