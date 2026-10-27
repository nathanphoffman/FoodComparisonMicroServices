use super::super::intelligence::{compute_intelligence, lifespan_years_for_slug, DEFAULT_LIFESPAN_YEARS};
use crate::models::{FoodRow, SliderQuery};

/// Intelligence-weighted kill of the animals caught and discarded as bycatch.
/// None when the food has no complete bycatch data.
pub(super) fn bycatch_score(food: &FoodRow, query: &SliderQuery) -> Option<f64> {
    let bycatch_amount       = food.bycatch_amount.filter(|&amount| amount > 0.0)?;
    let bycatch_neuron_count = food.bycatch_neuron_count.filter(|&neurons| neurons > 0.0)?;
    let bycatch_weight_kg    = food.bycatch_weight_kg.filter(|&weight| weight > 0.0)?;

    let bycatch_lifespan = food.bycatch_food_slug.as_deref()
        .map(lifespan_years_for_slug)
        .unwrap_or(DEFAULT_LIFESPAN_YEARS);
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
