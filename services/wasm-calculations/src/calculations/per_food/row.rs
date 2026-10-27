use super::divisor::{compute_divisor, NormFactors};
use super::nutrition::compute_nutrition_score;
use super::{emissions, water};
use crate::calculations::eco;
use crate::models::{FoodRow, ScoredRow, SentientHarmDetail, SliderQuery};

/// The sentient-harm pieces for one food, before they are divided into Compare By units.
struct Harm {
    /// Direct kill: animals killed on purpose.
    direct_kill: f64,
    /// Years of captivity, weighted by intelligence.
    captive: f64,
    /// Accidental deaths from crops, pesticides, pasture and bycatch.
    accidental: f64,
    /// Per-source scores for the tooltip (raw: the tooltip divides by the divisor).
    detail: SentientHarmDetail,
}

fn compute_harm(food: &FoodRow, query: &SliderQuery) -> Harm {
    let (accidental, mut detail) = eco::compute_sentient_harm(food, query);
    let direct_kill = eco::compute_direct_kill(food, query);
    let captive = eco::compute_captive_sentience(food, query);
    detail.direct_kill_score = direct_kill;
    detail.captive_sentience_score = captive;
    Harm { direct_kill, captive, accidental, detail }
}

/// The sentient_harm column before dividing by the divisor. kill_multiplier divides the accidental part,
/// matching TS. Captivity is intentional harm, so it sits alongside direct kill. At 0× intentional harm
/// carries no weight, so only accidental harm counts.
fn combined_sentient_harm(harm: &Harm, kill_multiplier: f64) -> f64 {
    if kill_multiplier > 0.0 {
        harm.direct_kill + harm.captive + harm.accidental / kill_multiplier
    } else {
        harm.accidental
    }
}

/// Scalability: food produced ÷ land needed per unit of food, both in the same calorie/protein units as the
/// other columns. Production in units = Gg × divisor; land per unit = land per kg ÷ divisor. (Dividing by the
/// divisor instead used to inflate watery, low-calorie foods like milk.) 1.0 when no production is recorded.
fn compute_availability(food: &FoodRow, divisor: f64, land_use_raw: f64) -> f64 {
    let Some(production_gg) = food.availability_gg else { return 1.0 };
    let production_units = production_gg * divisor;
    if land_use_raw == 0.0 {
        production_units
    } else {
        (production_units / (land_use_raw / divisor)).max(1.0)
    }
}

pub(in crate::calculations) fn compute_row(food: &FoodRow, query: &SliderQuery, norms: &NormFactors) -> ScoredRow {
    // None when the food has none of the Compare By unit (e.g. oil when comparing
    // by protein only): every per-unit value is then undefined, not per-kg.
    let divisor = compute_divisor(food, query, norms);
    let per_unit = |raw: f64| divisor.map(|divisor_value| raw / divisor_value);

    let (emissions_raw, emissions_breakdown) = emissions::compute_emissions(food);
    // land_use_raw is physical area (used for availability); land_use_weighted is
    // scaled by the Land Use sliders and only drives the Land Use column/score.
    let (land_use_raw, land_use_weighted, land_use_detail) = eco::compute_land_use(food, query);
    let (water_raw, water_detail) = water::effective_water(food, query);
    let harm = compute_harm(food, query);

    ScoredRow {
        name: food.name.clone(),
        slug: food.slug.clone(),
        food_type: food.food_type.clone(),
        divisor: divisor.unwrap_or(0.0),

        nutrition_score: compute_nutrition_score(food, &query.nutrition_weights),
        emissions: per_unit(emissions_raw),
        land_use: per_unit(land_use_weighted),
        water: per_unit(water_raw),
        direct_kill: per_unit(harm.direct_kill),
        captive_sentience: per_unit(harm.captive),
        sentient_harm: per_unit(combined_sentient_harm(&harm, query.kill_multiplier)),
        final_score: None, // filled in by apply()
        availability: divisor.map(|divisor_value| compute_availability(food, divisor_value, land_use_raw)),

        emissions_breakdown,
        water_detail,
        land_use_detail,
        sentient_harm_detail: harm.detail,
        kill_detail: eco::compute_kill_detail(food, query),
        wild_fish_deaths_per_kg: eco::wild_fish_deaths_per_kg(food),
        wild_fish_kill: eco::wild_fish_kill(food, query),
        improvement_detail: None, // filled in by apply()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn harm(direct_kill: f64, captive: f64, accidental: f64) -> Harm {
        Harm { direct_kill, captive, accidental, detail: SentientHarmDetail::zero() }
    }

    #[test]
    fn kill_multiplier_divides_only_the_accidental_harm() {
        // 10 + 2 intentional, plus 100 accidental ÷ 4.
        assert_eq!(combined_sentient_harm(&harm(10.0, 2.0, 100.0), 4.0), 37.0);
    }

    #[test]
    fn at_zero_multiplier_only_accidental_harm_counts() {
        assert_eq!(combined_sentient_harm(&harm(10.0, 2.0, 100.0), 0.0), 100.0);
    }
}
