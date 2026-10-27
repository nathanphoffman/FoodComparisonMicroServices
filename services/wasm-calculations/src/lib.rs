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
        .map_err(|error| JsValue::from_str(&format!("input parse error: {error}")))?;

    let perf = web_sys::window().and_then(|window| window.performance());
    let started_at = perf.as_ref().map(|performance| performance.now());

    // temporary: busy-wait 50ms to verify the timer reads correctly — remove after confirming
    if let Some(ref performance) = perf {
        let deadline = performance.now() + 50.0;
        while performance.now() < deadline {}
    }

    let scored = calculations::apply(input.foods, &input.query);

    if let (Some(performance), Some(start)) = (perf, started_at) {
        let elapsed_ms = performance.now() - start;
        web_sys::console::log_1(&format!("[wasm] score() took {elapsed_ms:.3} ms").into());
    }

    serde_wasm_bindgen::to_value(&scored)
        .map_err(|error| JsValue::from_str(&format!("serialise error: {error}")))
}
