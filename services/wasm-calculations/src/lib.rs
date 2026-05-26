// AI AGENTS: This crate's only public surface is the `score` fn below.
// There is NO coupling to apps/web — a dev-only HMR signal file
// (apps/web/app/_wasm-signal.ts) is written by scripts/wasm-notify.mjs
// after each build, but that is purely a browser-reload trigger with no
// runtime dependency in either direction. Do not cross that boundary.
mod calculations;
mod models;

use wasm_bindgen::prelude::*;
use models::ScoreInput;

/// Score a slice of food rows using the current slider values.
///
/// `input_js` – `{ foods: FoodRow[], query: SliderQuery }` bundled as one object.
///
/// Returns a JSON array of ScoredRow objects, each containing aggregate scores
/// and tooltip breakdown details.
#[wasm_bindgen]
pub fn score(input_js: JsValue) -> Result<JsValue, JsValue> {
    let input: ScoreInput = serde_wasm_bindgen::from_value(input_js)
        .map_err(|e| JsValue::from_str(&format!("input parse error: {e}")))?;

    let scored = calculations::apply(input.foods, &input.query);

    serde_wasm_bindgen::to_value(&scored)
        .map_err(|e| JsValue::from_str(&format!("serialise error: {e}")))
}
