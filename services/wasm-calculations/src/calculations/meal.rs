use crate::models::{MealIngredient, ScoredRow};

pub fn synthesize_meal(rows: &[ScoredRow], ingredients: &[MealIngredient]) -> Option<ScoredRow> {
    let total: f64 = ingredients.iter().map(|i| i.fraction).sum();
    if total <= 0.0 { return None; }

    let mut matched       = 0_usize;
    let mut divisor       = 0.0_f64;
    let mut nutrition     = 0.0_f64;
    let mut emissions     = 0.0_f64;
    let mut land_use      = 0.0_f64;
    let mut water         = 0.0_f64;
    let mut direct_kill   = 0.0_f64;
    let mut captive       = 0.0_f64;
    let mut sentient_harm = 0.0_f64;

    for ing in ingredients {
        let weight = ing.fraction / total;
        if let Some(row) = rows.iter().find(|r| r.slug == ing.slug) {
            matched += 1;
            divisor       += weight * row.divisor;
            nutrition     += weight * row.nutrition_score.unwrap_or(0.0);
            emissions     += weight * row.emissions.unwrap_or(0.0);
            land_use      += weight * row.land_use.unwrap_or(0.0);
            water         += weight * row.water.unwrap_or(0.0);
            direct_kill   += weight * row.direct_kill.unwrap_or(0.0);
            captive       += weight * row.captive_sentience.unwrap_or(0.0);
            sentient_harm += weight * row.sentient_harm.unwrap_or(0.0);
        }
    }

    if matched == 0 { return None; }

    Some(ScoredRow {
        name:      "Your Meal".to_string(),
        slug:      "your-meal".to_string(),
        food_type: "meal".to_string(),
        divisor,
        nutrition_score: Some(nutrition),
        emissions:       Some(emissions),
        land_use:        Some(land_use),
        water:           Some(water),
        direct_kill:     Some(direct_kill),
        captive_sentience: Some(captive),
        sentient_harm:   Some(sentient_harm),
        final_score:     None,
        availability:    None,
        emissions_breakdown:  None,
        water_detail:         crate::models::WaterDetail  { green: None, blue: None, grey: None },
        land_use_detail:      crate::models::LandUseDetail {
            land_type: "meal".to_string(),
            yield_kilograms_per_hectare: None,
            pasture_hectares_per_kilogram: None,
            feed_land_m2_per_kg: None,
            raw_m2_per_kg: 0.0,
            land_types: None,
            multiplier: 1.0,
        },
        sentient_harm_detail: crate::models::SentientHarmDetail::zero(),
        kill_detail:          None,
    })
}
