use crate::models::{FoodRow, SliderQuery};

const GRAMS_PER_KG: f64 = 1_000.0;
const CALORIE_NORM_FALLBACK: f64 = 1_000.0;
const PROTEIN_NORM_FALLBACK: f64 = 100.0;
const DRY_MASS_NORM_FALLBACK: f64 = 300.0;

// ── Batch-derived normalisation ───────────────────────────────────────────────

/// Arithmetic mean of the positive, finite values in `iter`, or `None` if
/// there are no such values.
fn mean_nonzero(iter: impl Iterator<Item = f64>) -> Option<f64> {
    let (sum, count) = iter
        .filter(|&v| v > 0.0 && v.is_finite())
        .fold((0.0_f64, 0_usize), |(s, n), v| (s + v, n + 1));
    if count == 0 {
        None
    } else {
        Some(sum / count as f64)
    }
}

/// Per-batch normalization factors for the divisor.
/// Each field is the arithmetic mean of the corresponding per-kg value across
/// the batch, falling back to a legacy constant when all values are zero or the
/// batch is empty.
pub(super) struct NormFactors {
    calorie_norm: f64,
    protein_norm: f64,
    dry_mass_norm: f64,
}

/// Grams of dry matter per gram of food: everything except water, approximated as
/// protein + fat + carbohydrate (USDA carbs include fiber). Ash (~1%) is ignored.
/// The same whether a food is measured raw or cooked, since cooking only adds water.
fn dry_mass_per_gram(food: &FoodRow) -> f64 {
    food.protein + food.fat + food.carbs.unwrap_or(0.0)
}

impl NormFactors {
    pub(super) fn from_foods(foods: &[FoodRow]) -> Self {
        Self {
            calorie_norm: mean_nonzero(foods.iter().map(|f| f.calories * GRAMS_PER_KG))
                .unwrap_or(CALORIE_NORM_FALLBACK),
            protein_norm: mean_nonzero(foods.iter().map(|f| f.protein * GRAMS_PER_KG))
                .unwrap_or(PROTEIN_NORM_FALLBACK),
            dry_mass_norm: mean_nonzero(foods.iter().map(|f| dry_mass_per_gram(f) * GRAMS_PER_KG))
                .unwrap_or(DRY_MASS_NORM_FALLBACK),
        }
    }
}

// ── Divisor (unit normalisation) ─────────────────────────────────────────────

/// Amount of Compare By units in one kg of this food. None when the food has none
/// of the chosen unit (it used to fall back to 1, scoring zero-protein oils as if
/// they had average protein). With every weight at 0, compares per kg.
pub(super) fn compute_divisor(food: &FoodRow, query: &SliderQuery, norms: &NormFactors) -> Option<f64> {
    if query.calorie_weight + query.protein_weight + query.dry_mass_weight + query.wet_mass_weight <= 0.0 {
        return Some(1.0);
    }
    // calories and protein are given to us in per gram
    let calories_per_kg = food.calories * GRAMS_PER_KG;
    let protein_per_kg = food.protein * GRAMS_PER_KG;

    // norms are also per gram, so we are effectively amount over norm times weight percentage.
    // No mass term: comparing per kg mostly measures water content (and dry vs cooked).
    let weighted = (query.calorie_weight / 100.0) * (calories_per_kg / norms.calorie_norm)
        + (query.protein_weight / 100.0) * (protein_per_kg / norms.protein_norm)
        + (query.dry_mass_weight / 100.0) * (dry_mass_per_gram(food) * GRAMS_PER_KG / norms.dry_mass_norm)
        // Wet mass: every food is stored per kg as eaten (beans, rice, quinoa etc. on a
        // cooked basis), so one kg of food is one kg of wet mass — no norm needed.
        + (query.wet_mass_weight / 100.0);
    if weighted > 0.0 { Some(weighted) } else { None }
}
