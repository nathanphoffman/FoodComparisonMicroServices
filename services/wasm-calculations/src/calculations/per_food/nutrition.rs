use crate::models::{AminoAcids, FoodRow, NutritionWeights};

/// Nutrition score per 100 kcal. Foods with no calories (diet soda, water) score 0 —
/// they add nothing good or bad.
pub(super) fn compute_nutrition_score(food: &FoodRow, weights: &NutritionWeights) -> Option<f64> {
    if food.calories <= 0.0 {
        return Some(0.0);
    }
    let free_sugar = (food.sugar.unwrap_or(0.0) - weights.sugar_allowance * food.fiber).max(0.0);
    let protein_quality = protein_quality_factor(food.amino_acids.as_ref(), food.protein, weights.protein_quality);
    let raw = weights.protein * food.protein * protein_quality + weights.fiber * food.fiber
        - weights.sat_fat * food.sat_fat
        - weights.free_sugar * free_sugar
        // sodium is mg per gram and its weight is per 100 mg
        - weights.sodium * food.sodium.unwrap_or(0.0) / 100.0
        + weights.micronutrients * food.micronutrients.as_ref().map_or(0.0, |m| m.daily_value_fraction());

    Some(raw * 100.0 / food.calories)
}

/// Share of a food's protein points it keeps: 1 for a complete protein, and less as its weakest
/// essential amino acid falls short of what the body needs. `slider` (0–1) is how much of the
/// shortfall is taken off. Foods with no amino acid data keep all their protein points.
fn protein_quality_factor(amino_acids: Option<&AminoAcids>, protein_per_gram: f64, slider: f64) -> f64 {
    let amino_score = amino_acids.and_then(|a| a.score(protein_per_gram)).unwrap_or(1.0);
    1.0 - slider.clamp(0.0, 1.0) * (1.0 - amino_score)
}

#[cfg(test)]
mod tests {
    use super::*;

    /// Protein of 0.1 g per g whose lysine is half of what the body needs.
    fn lysine_short() -> AminoAcids {
        let g = |mg_per_g_protein: f64| Some(mg_per_g_protein / 1000.0 * 0.10);
        AminoAcids {
            histidine: g(16.0), isoleucine: g(30.0), leucine: g(61.0), lysine: g(24.0),
            methionine: g(15.0), cystine: g(8.0), phenylalanine: g(25.0), tyrosine: g(16.0),
            threonine: g(25.0), tryptophan: g(6.6), valine: g(40.0),
            ..Default::default()
        }
    }

    #[test]
    fn a_missing_amino_acid_cuts_the_protein_points() {
        // lysine is 50% of need: the full slider takes off half the protein points, half the slider a quarter
        assert!((protein_quality_factor(Some(&lysine_short()), 0.10, 1.0) - 0.5).abs() < 1e-9);
        assert!((protein_quality_factor(Some(&lysine_short()), 0.10, 0.5) - 0.75).abs() < 1e-9);
    }

    #[test]
    fn slider_at_zero_or_no_data_keeps_every_point() {
        assert_eq!(protein_quality_factor(Some(&lysine_short()), 0.10, 0.0), 1.0);
        assert_eq!(protein_quality_factor(None, 0.10, 1.0), 1.0);
        assert_eq!(protein_quality_factor(Some(&AminoAcids::default()), 0.10, 1.0), 1.0);
    }

    #[test]
    fn slider_is_kept_between_zero_and_one() {
        assert_eq!(protein_quality_factor(Some(&lysine_short()), 0.10, 5.0), protein_quality_factor(Some(&lysine_short()), 0.10, 1.0));
        assert_eq!(protein_quality_factor(Some(&lysine_short()), 0.10, -1.0), 1.0);
    }
}
