mod calculations;
mod models;

use wasm_bindgen::prelude::*;
use models::{FoodRow, SliderQuery};

/// Score a slice of food rows using the current slider values.
///
/// `foods_js`  – JSON array of FoodRow objects (from GET /api/foods)
/// `query_js`  – JSON object of SliderQuery values (from the FoodTable sliders)
///
/// Returns a JSON array of ScoredRow objects.
#[wasm_bindgen]
pub fn score(foods_js: JsValue, query_js: JsValue) -> Result<JsValue, JsValue> {
    let foods: Vec<FoodRow> = serde_wasm_bindgen::from_value(foods_js)
        .map_err(|e| JsValue::from_str(&format!("foods parse error: {e}")))?;
    let query: SliderQuery = serde_wasm_bindgen::from_value(query_js)
        .map_err(|e| JsValue::from_str(&format!("query parse error: {e}")))?;

    let scored = calculations::apply(foods, &query);

    serde_wasm_bindgen::to_value(&scored)
        .map_err(|e| JsValue::from_str(&format!("serialise error: {e}")))
}
