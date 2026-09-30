mod food_row;
mod land_types;
mod slider_query;

use serde::Deserialize;

pub use food_row::FoodRow;
pub use land_types::LandTypes;
pub use slider_query::{MealIngredient, SliderQuery};

/// Single input object bundling all foods + slider state into one WASM call.
/// Keeps the JS/Rust boundary simple — one object in, one array out.
#[derive(Debug, Deserialize)]
pub struct ScoreInput {
    pub foods: Vec<FoodRow>,
    pub query: SliderQuery,
}
