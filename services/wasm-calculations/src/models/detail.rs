use serde::Serialize;

use super::LandTypes;

// The tooltip detail types. Serialised with camelCase to match the TypeScript detail types in
// FoodTableTypes.ts (Types/ScoreDetailTypes.ts).

/// Per-gas breakdown of greenhouse gas emissions (all in kg CO₂e per kg food).
#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct EmissionsBreakdown {
    pub co2: f64,
    pub ch4: f64,
    pub n2o: f64,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub feed_emissions: Option<f64>,
}

/// Raw (unweighted) water footprint components (L per kg food).
/// Slider weighting is applied client-side in WaterTooltip.
#[derive(Debug, Clone, Serialize)]
pub struct WaterDetail {
    pub green: Option<f64>,
    pub blue:  Option<f64>,
    pub grey:  Option<f64>,
}

/// Land use breakdown for tooltip display.
#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct LandUseDetail {
    #[serde(rename = "type")]
    pub land_type:                    String,   // "plant" | "animal"
    pub yield_kilograms_per_hectare:  Option<f64>,
    pub pasture_hectares_per_kilogram: Option<f64>,
    pub feed_land_m2_per_kg:          Option<f64>,
    /// Unweighted land area (m² per kg), before the land type multiplier.
    pub raw_m2_per_kg:                f64,
    /// This food's land split; None when the food has no split.
    pub land_types:                   Option<LandTypes>,
    /// Weighted average of the Land Use slider weights over the split (1.0 = neutral).
    pub multiplier:                   f64,
}

/// Per-species/source breakdown of sentient harm score (pre-combination values).
#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct SentientHarmDetail {
    pub direct_kill_score:           f64,
    pub insect_score:                f64,
    pub bee_score:                   f64,
    pub worm_score:                  f64,
    pub deforestation_score:         f64,
    pub feed_insect_score:           f64,
    pub feed_bee_score:              f64,
    pub feed_worm_score:             f64,
    pub feed_deforestation_score:    f64,
    pub pasture_deforestation_score: f64,
    pub bycatch_score:               f64,
    pub captive_sentience_score:     f64,
}

impl SentientHarmDetail {
    pub fn zero() -> Self {
        SentientHarmDetail {
            direct_kill_score: 0.0,
            insect_score: 0.0, bee_score: 0.0, worm_score: 0.0, deforestation_score: 0.0,
            feed_insect_score: 0.0, feed_bee_score: 0.0, feed_worm_score: 0.0,
            feed_deforestation_score: 0.0, pasture_deforestation_score: 0.0, bycatch_score: 0.0,
            captive_sentience_score: 0.0,
        }
    }
}

/// Per-animal facts behind the direct kill and captivity scores, for the
/// tooltips. None for plants, diets, and animals missing kill data.
#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct KillDetail {
    pub output_kg_per_death:        f64, // kg of food produced per producing animal
    pub offspring_deaths:           f64, // offspring killed per producing animal
    pub captivity_years:            f64, // producing animal's years in captivity
    pub offspring_captivity_years:  f64, // each offspring's years in captivity
    pub intelligence_per_death:     f64, // intelligence score of one death of this animal
    pub lifespan_years:             f64, // species lifespan used in the intelligence score
}

/// One measure's contribution to the Improvement score: ratio > 1 beats the reference.
#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ImprovementTerm {
    pub measure:  &'static str, // "nutrition" | "emissions" | "landUse" | "water" | "sentientHarm" | "availability"
    pub ratio:    f64,
    pub priority: f64,
    /// True when the food scored 0 here and got the batch's best ratio × the zero-better multiplier.
    pub zero_capped: bool,
}

/// How the Improvement score was put together, for the food detail modal.
#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ImprovementDetail {
    pub terms:    Vec<ImprovementTerm>,
    /// Power-mean exponent: 1 = plain average, 0 = geometric mean (default), -1 = harmonic.
    pub exponent: f64,
    /// Score before the wild penalty.
    pub mean:     f64,
    /// Over-Hunting / Over-Gathering divisor relative to the reference (1 = none).
    pub wild_penalty: f64,
}
