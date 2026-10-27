use crate::models::{Basis, Diet, FoodRow, ScoredRow};

/// A diet's blended row plus how much each ingredient counts toward it.
pub struct Blend {
    pub row: ScoredRow,
    /// (slug, share of the blend's Compare By units); shares sum to 1.
    pub shares: Vec<(String, f64)>,
    /// True when an ingredient in the blend has none of the Compare By unit.
    pub has_unitless: bool,
}

/// Each ingredient's share of the blend's mass (sums to 1), whatever the user's basis.
/// A calorie share is turned into mass by dividing by the food's calories per gram;
/// foods with no calories can't hold a calorie share, so they drop out.
fn mass_shares(foods: &[FoodRow], diet: &Diet) -> Vec<(String, f64)> {
    // Keep ingredients with a positive share; a calorie share becomes mass, and unknown or zero-calorie foods drop out.
    let raw: Vec<(String, f64)> = diet.ingredients.iter().filter(|ingredient| ingredient.fraction > 0.0).filter_map(|ingredient| {
        match diet.basis {
            Basis::Mass => Some((ingredient.slug.clone(), ingredient.fraction)),
            Basis::Calories => {
                let calories_per_gram = foods.iter().find(|f| f.slug == ingredient.slug)?.calories;
                (calories_per_gram > 0.0).then(|| (ingredient.slug.clone(), ingredient.fraction / calories_per_gram))
            }
        }
    }).collect();
    let total: f64 = raw.iter().map(|(_, m)| m).sum();
    if total <= 0.0 { return Vec::new(); }
    raw.into_iter().map(|(slug, m)| (slug, m / total)).collect()
}

/// How much each ingredient counts toward the blend (sums to 1), the blend's divisor (Compare By units per kg of the
/// blend), and whether any ingredient has none of the unit.
///
/// Rows hold values per Compare By unit, and a kg of each food holds a different
/// number of units (its divisor). So an ingredient counts in proportion to
/// mass × divisor.
fn unit_weights(rows: &[ScoredRow], masses: &[(String, f64)]) -> (Vec<f64>, f64, bool) {
    let divisor_of = |slug: &str| rows.iter().find(|r| r.slug == slug).map_or(0.0, |r| r.divisor);
    // Units of the Compare By measure each ingredient contributes: its mass times its divisor.
    let units: Vec<f64> = masses.iter().map(|(slug, m)| m * divisor_of(slug)).collect();
    let divisor: f64 = units.iter().sum();
    let has_unitless = masses.iter().any(|(slug, _)| divisor_of(slug) <= 0.0);
    // With no units at all there is nothing to weight by; fall back to mass.
    let weights = if divisor > 0.0 {
        units.iter().map(|u| u / divisor).collect()
    } else {
        masses.iter().map(|(_, m)| *m).collect()
    };
    (weights, divisor, has_unitless)
}

/// The blend's aggregate scores: each ingredient's score weighted by its share.
#[derive(Default)]
struct BlendedScores {
    nutrition: f64, emissions: f64, land_use: f64, water: f64,
    direct_kill: f64, captive: f64, sentient_harm: f64,
}

/// Weighted sum of the ingredients' scores, and how many of them were found in `rows`.
fn blend_scores(rows: &[ScoredRow], masses: &[(String, f64)], weights: &[f64]) -> (BlendedScores, usize) {
    let mut scores = BlendedScores::default();
    let mut matched = 0;
    for ((slug, _), weight) in masses.iter().zip(weights) {
        if let Some(row) = rows.iter().find(|r| &r.slug == slug) {
            matched += 1;
            scores.nutrition     += weight * row.nutrition_score.unwrap_or(0.0);
            scores.emissions     += weight * row.emissions.unwrap_or(0.0);
            scores.land_use      += weight * row.land_use.unwrap_or(0.0);
            scores.water         += weight * row.water.unwrap_or(0.0);
            scores.direct_kill   += weight * row.direct_kill.unwrap_or(0.0);
            scores.captive       += weight * row.captive_sentience.unwrap_or(0.0);
            scores.sentient_harm += weight * row.sentient_harm.unwrap_or(0.0);
        }
    }
    (scores, matched)
}

/// A blend's row: its aggregate scores, with no tooltip breakdowns (those only exist for single foods).
fn blend_row(diet: &Diet, divisor: f64, scores: BlendedScores) -> ScoredRow {
    ScoredRow {
        name:      diet.name.clone(),
        slug:      diet.slug.clone(),
        food_type: "diet".to_string(),
        divisor,
        nutrition_score: Some(scores.nutrition),
        emissions:       Some(scores.emissions),
        land_use:        Some(scores.land_use),
        water:           Some(scores.water),
        direct_kill:     Some(scores.direct_kill),
        captive_sentience: Some(scores.captive),
        sentient_harm:   Some(scores.sentient_harm),
        final_score:     None,
        availability:    None,
        emissions_breakdown:  None,
        water_detail:         crate::models::WaterDetail  { green: None, blue: None, grey: None },
        land_use_detail:      crate::models::LandUseDetail {
            land_type: "diet".to_string(),
            yield_kilograms_per_hectare: None,
            pasture_hectares_per_kilogram: None,
            feed_land_m2_per_kg: None,
            raw_m2_per_kg: 0.0,
            land_types: None,
            multiplier: 1.0,
        },
        sentient_harm_detail: crate::models::SentientHarmDetail::zero(),
        kill_detail:          None,
        wild_fish_deaths_per_kg: None,
        wild_fish_kill:       0.0,
        improvement_detail:   None,
    }
}

pub fn blend_diet(rows: &[ScoredRow], foods: &[FoodRow], diet: &Diet) -> Option<Blend> {
    let masses = mass_shares(foods, diet);
    let (weights, divisor, has_unitless) = unit_weights(rows, &masses);
    let (scores, matched) = blend_scores(rows, &masses, &weights);
    if matched == 0 { return None; }

    let row = blend_row(diet, divisor, scores);
    Some(Blend { row, shares: masses.into_iter().map(|(slug, _)| slug).zip(weights).collect(), has_unitless })
}
