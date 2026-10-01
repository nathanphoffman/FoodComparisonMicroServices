use super::intelligence::{captivity_years_for_slug, compute_intelligence, lifespan_years_for_slug};
use crate::models::{FoodRow, KillDetail, SliderQuery};

// ── Direct kill ───────────────────────────────────────────────────────────────

/// Intelligence score of one death of this animal, and the kg of food produced
/// per producing animal. None for plants and animals missing kill data.
fn intelligence_and_output(food: &FoodRow, query: &SliderQuery) -> Option<(f64, f64)> {
    if food.food_type != "animal" {
        return None;
    }

    let (neuron_count, body_weight_kg, yield_fraction) =
        match (food.neuron_count, food.weight_kg, food.yield_fraction) {
            (Some(n), Some(w), Some(y)) if n > 0.0 && w > 0.0 && y > 0.0 => (n, w, y),
            _ => return None,
        };

    // kg of food output per animal death: explicit for continuous-production animals
    // (layer hens, dairy), derived from body mass × yield for single-slaughter animals.
    let output_kg_per_death = food.lifetime_output_kg
        .unwrap_or(body_weight_kg * yield_fraction);

    let intelligence = compute_intelligence(
        neuron_count,
        body_weight_kg,
        lifespan_years_for_slug(&food.slug),
        query.neuron_exponent,
        query.weight_exponent,
        query.final_intelligence_exponent,
    );
    Some((intelligence, output_kg_per_death))
}

fn offspring_deaths(food: &FoodRow) -> f64 {
    food.offspring_deaths_per_animal.unwrap_or(0.0).max(0.0)
}

fn offspring_captivity_years(food: &FoodRow) -> f64 {
    food.offspring_captivity_years.unwrap_or(0.0).max(0.0)
}

/// Deaths per kg of food: the producing animal plus any offspring killed to keep
/// it in production (dairy calves, culled male chicks), plus wild fish killed for
/// fishmeal / fish oil. Offspring are scored as the same species as the parent.
pub(in crate::calculations) fn compute_direct_kill(food: &FoodRow, query: &SliderQuery) -> f64 {
    let own = intelligence_and_output(food, query).map_or(0.0, |(intelligence, output_kg)| {
        intelligence * (1.0 + offspring_deaths(food)) / output_kg
    });
    own + wild_fish_kill(food, query)
}

/// Number of wild fish killed per kg of food, for fishmeal / fish oil and for
/// animals fed them. None when the food involves no reduction fishery.
pub(in crate::calculations) fn wild_fish_deaths_per_kg(food: &FoodRow) -> Option<f64> {
    match (food.wild_fish_kg_per_kg, food.wild_fish_weight_kg) {
        (Some(fish_kg), Some(fish_weight_kg)) if fish_kg > 0.0 && fish_weight_kg > 0.0 => Some(fish_kg / fish_weight_kg),
        _ => None,
    }
}

/// Intelligence-weighted kill of the wild fish behind fishmeal / fish oil.
/// These fish are caught on purpose, so this is direct kill, not accidental harm.
pub(in crate::calculations) fn wild_fish_kill(food: &FoodRow, query: &SliderQuery) -> f64 {
    let (Some(deaths_per_kg), Some(neuron_count)) = (wild_fish_deaths_per_kg(food), food.wild_fish_neuron_count) else {
        return 0.0;
    };
    let fish_weight_kg = food.wild_fish_weight_kg.unwrap_or(0.0);
    deaths_per_kg * compute_intelligence(
        neuron_count,
        fish_weight_kg,
        food.wild_fish_lifespan_years.unwrap_or(1.0),
        query.neuron_exponent,
        query.weight_exponent,
        query.final_intelligence_exponent,
    )
}

// ── Captive sentience ─────────────────────────────────────────────────────────

/// Suffering from time spent in captivity, expressed as extra deaths:
/// each year in captivity counts as `captivity_multiplier` additional kills.
/// Includes the captivity time of offspring killed for this food.
pub(in crate::calculations) fn compute_captive_sentience(food: &FoodRow, query: &SliderQuery) -> f64 {
    intelligence_and_output(food, query).map_or(0.0, |(intelligence, output_kg)| {
        let animal_years = captivity_years_for_slug(&food.slug)
            + offspring_deaths(food) * offspring_captivity_years(food);
        intelligence * animal_years * query.captivity_multiplier / output_kg
    })
}

/// Per-animal numbers behind direct kill and captivity, for the tooltips.
pub(in crate::calculations) fn compute_kill_detail(food: &FoodRow, query: &SliderQuery) -> Option<KillDetail> {
    intelligence_and_output(food, query).map(|(intelligence, output_kg)| KillDetail {
        output_kg_per_death:       output_kg,
        offspring_deaths:          offspring_deaths(food),
        captivity_years:           captivity_years_for_slug(&food.slug),
        offspring_captivity_years: offspring_captivity_years(food),
        intelligence_per_death:    intelligence,
        lifespan_years:            lifespan_years_for_slug(&food.slug),
    })
}
