use super::divisor::{compute_divisor, NormFactors};
use super::nutrition::compute_nutrition_score;
use super::{eco, emissions, water};
use crate::models::{FoodRow, ScoredRow, SliderQuery};

// ── Per-food computation ─────────────────────────────────────────────────────

pub(super) fn compute_row(food: &FoodRow, query: &SliderQuery, norms: &NormFactors) -> ScoredRow {
    // None when the food has none of the Compare By unit (e.g. oil when comparing
    // by protein only): every per-unit value is then undefined, not per-kg.
    let divisor = compute_divisor(food, query, norms);
    let per_unit = |raw: f64| divisor.map(|d| raw / d);

    let nutrition_score = compute_nutrition_score(food);

    let (emissions_raw, emissions_breakdown) = emissions::compute_emissions(food);
    // land_use_raw is physical area (used for availability); land_use_weighted is
    // scaled by the Land Use sliders and only drives the Land Use column/score.
    let (land_use_raw, land_use_weighted, land_use_detail) = eco::compute_land_use(food, query);
    let (water_raw, water_detail) = water::effective_water(food, query);
    let (sentient_harm_raw, mut sentient_harm_detail) = eco::compute_sentient_harm(food, query);

    let direct_kill_raw = eco::compute_direct_kill(food, query);
    let captive_raw = eco::compute_captive_sentience(food, query);
    // Detail scores are raw — the tooltip divides by the divisor.
    sentient_harm_detail.direct_kill_score = direct_kill_raw;
    sentient_harm_detail.captive_sentience_score = captive_raw;

    // Scalability: food produced ÷ land needed per unit of food, both in the same
    // calorie/protein units as the other columns. Production in units = Gg × divisor;
    // land per unit = land per kg ÷ divisor. (Dividing by the divisor instead used to
    // inflate watery, low-calorie foods like milk.)
    let availability = divisor.map(|divisor| food.availability_gg.map_or(1.0, |production_gg| {
        let production_units = production_gg * divisor;
        if land_use_raw == 0.0 {
            production_units
        } else {
            (production_units / (land_use_raw / divisor)).max(1.0)
        }
    }));

    ScoredRow {
        name: food.name.clone(),
        slug: food.slug.clone(),
        food_type: food.food_type.clone(),
        divisor: divisor.unwrap_or(0.0),

        nutrition_score,
        emissions: per_unit(emissions_raw),
        land_use: per_unit(land_use_weighted),
        water: per_unit(water_raw),
        direct_kill: per_unit(direct_kill_raw),
        captive_sentience: per_unit(captive_raw),
        // kill_multiplier is applied to sentient_harm as a divisor, matching TS.
        // Captivity is intentional harm, so it sits alongside direct kill.
        // At 0× intentional harm carries no weight, so only accidental harm counts.
        sentient_harm: per_unit(if query.kill_multiplier > 0.0 {
            direct_kill_raw + captive_raw + sentient_harm_raw / query.kill_multiplier
        } else {
            sentient_harm_raw
        }),
        final_score: None, // filled in by apply()
        availability,

        emissions_breakdown,
        water_detail,
        land_use_detail,
        sentient_harm_detail,
        kill_detail: eco::compute_kill_detail(food, query),
        wild_fish_deaths_per_kg: eco::wild_fish_deaths_per_kg(food),
        wild_fish_kill: eco::wild_fish_kill(food, query),
        improvement_detail: None, // filled in by apply()
    }
}
