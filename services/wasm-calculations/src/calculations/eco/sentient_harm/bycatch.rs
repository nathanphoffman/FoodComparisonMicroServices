use super::super::intelligence::{compute_intelligence, lifespan_years_for_slug};
use crate::models::{FoodRow, SliderQuery};

const DEFAULT_BYCATCH_LIFESPAN_YEARS: f64 = 10.0;

/// Intelligence-weighted kill of the animals caught and discarded as bycatch.
/// None when the food has no complete bycatch data.
pub(super) fn bycatch_score(food: &FoodRow, query: &SliderQuery) -> Option<f64> {
    let bycatch_amount       = food.bycatch_amount.filter(|&a| a > 0.0)?;
    let bycatch_neuron_count = food.bycatch_neuron_count.filter(|&n| n > 0.0)?;
    let bycatch_weight_kg    = food.bycatch_weight_kg.filter(|&w| w > 0.0)?;

    let bycatch_lifespan = food.bycatch_food_slug.as_deref()
        .map(lifespan_years_for_slug)
        .unwrap_or(DEFAULT_BYCATCH_LIFESPAN_YEARS);
    let num_bycatch_individuals = bycatch_amount / bycatch_weight_kg;

    Some(num_bycatch_individuals
        * compute_intelligence(
            bycatch_neuron_count,
            bycatch_weight_kg,
            bycatch_lifespan,
            query.neuron_exponent,
            query.weight_exponent,
            query.final_intelligence_exponent,
        ))
}
