use crate::models::{Basis, CustomFood, FoodRow, ScoredRow};

/// A custom food's blended row plus how much each ingredient counts toward it.
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
fn mass_shares(foods: &[FoodRow], custom: &CustomFood) -> Vec<(String, f64)> {
    let raw: Vec<(String, f64)> = custom.ingredients.iter().filter(|i| i.fraction > 0.0).filter_map(|i| {
        match custom.basis {
            Basis::Mass => Some((i.slug.clone(), i.fraction)),
            Basis::Calories => {
                let calories_per_gram = foods.iter().find(|f| f.slug == i.slug)?.calories;
                (calories_per_gram > 0.0).then(|| (i.slug.clone(), i.fraction / calories_per_gram))
            }
        }
    }).collect();
    let total: f64 = raw.iter().map(|(_, m)| m).sum();
    if total <= 0.0 { return Vec::new(); }
    raw.into_iter().map(|(slug, m)| (slug, m / total)).collect()
}

pub fn synthesize(rows: &[ScoredRow], foods: &[FoodRow], custom: &CustomFood) -> Option<Blend> {
    let masses = mass_shares(foods, custom);
    let divisor_of = |slug: &str| rows.iter().find(|r| r.slug == slug).map_or(0.0, |r| r.divisor);

    // Rows hold values per Compare By unit, and a kg of each food holds a different
    // number of units (its divisor). So an ingredient counts in proportion to
    // mass × divisor; the blend's divisor is units per kg of the blend.
    let units: Vec<f64> = masses.iter().map(|(slug, m)| m * divisor_of(slug)).collect();
    let divisor: f64 = units.iter().sum();
    let has_unitless = masses.iter().any(|(slug, _)| divisor_of(slug) <= 0.0);
    // With no units at all there is nothing to weight by; fall back to mass.
    let weights: Vec<f64> = if divisor > 0.0 {
        units.iter().map(|u| u / divisor).collect()
    } else {
        masses.iter().map(|(_, m)| *m).collect()
    };

    let mut matched       = 0_usize;
    let mut nutrition     = 0.0_f64;
    let mut emissions     = 0.0_f64;
    let mut land_use      = 0.0_f64;
    let mut water         = 0.0_f64;
    let mut direct_kill   = 0.0_f64;
    let mut captive       = 0.0_f64;
    let mut sentient_harm = 0.0_f64;

    for ((slug, _), weight) in masses.iter().zip(&weights) {
        if let Some(row) = rows.iter().find(|r| &r.slug == slug) {
            matched += 1;
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

    let row = ScoredRow {
        name:      custom.name.clone(),
        slug:      custom.slug.clone(),
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
        wild_fish_deaths_per_kg: None,
        wild_fish_kill:       0.0,
        improvement_detail:   None,
    };
    Some(Blend { row, shares: masses.into_iter().map(|(slug, _)| slug).zip(weights).collect(), has_unitless })
}
