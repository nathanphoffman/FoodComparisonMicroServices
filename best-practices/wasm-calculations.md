# Best practices — services/wasm-calculations (Rust / wasm-bindgen)

## Naming

Follow Rust conventions: `snake_case` for functions, variables, modules, and fields; `PascalCase` for types and structs; `SCREAMING_SNAKE_CASE` for constants. Names spell things out completely — no abbreviations, no acronyms, no single-letter variables. Write `food_row` not `f`, `emissions_per_kilogram` not `epk`, `weighted_average` not `wavg`. The only exceptions are scientific terms that are universally understood in context (`paf`, `gwp`, `ld50`, `ha`) — even these should be spelled out in comments the first time they appear in a module. Avoid generic names like `data`, `result`, or `tmp`.

## Module boundaries

The crate has three modules: `lib.rs` (WASM boundary only), `calculations.rs` (pure math), and `models.rs` (data shapes). Keep this separation strict. `lib.rs` must contain no calculation logic — only deserialise, call `calculations::apply`, and serialise. `calculations.rs` must contain no `wasm_bindgen` or serde imports. `models.rs` owns all `Serialize`/`Deserialize` derives. If `calculations.rs` grows beyond roughly 100 lines, split it into focused sub-modules (e.g. `calculations/emissions.rs`, `calculations/water.rs`) rather than letting it grow into a single large file.

## Regex

Avoid regex entirely — Rust's string methods, `char` predicates, and pattern matching cover almost every case more readably. If regex becomes genuinely necessary, use the `regex` crate with a named `const` pattern and a comment in plain English explaining exactly what it matches, what it rejects, and why no named alternative was used.

## WASM boundary

`lib.rs` is the only file that imports `wasm_bindgen`. Every `#[wasm_bindgen]` function takes and returns `JsValue`, delegates immediately to pure Rust, and uses `map_err(|e| JsValue::from_str(...))` for error propagation. Do not add business logic in `lib.rs`.

## Pure functions

All functions in `calculations.rs` are pure: no I/O, no global mutable state, no `unsafe`. Prefer more, smaller functions over large ones — a function that computes two independent values should be two functions. Functions over roughly 20 lines should be broken into named helpers. Functions that only apply to one food type (`compute_emissions`, `compute_land_use`, etc.) should remain separate named functions rather than being merged into a single dispatch function.

## Constants

Every numeric literal used in a formula must be a named `const f64` at the top of `calculations.rs` with a comment indicating its units and the matching TypeScript or scientific source. Inline magic numbers are a violation. When a constant depends on others, express the relationship in a comment rather than pre-multiplying silently.

## Option handling

Use `Option<f64>` for nullable data columns, matching the C# and TypeScript nullable convention. Use `.unwrap_or(0.0)` only when zero is a genuine neutral value for the calculation. When a `None` should skip the entire computation path, use `?` or an explicit `if let` match — do not silently substitute zero when absence means "data unavailable."

## Error handling

Functions return `f64` or `Option<f64>` — they do not panic. The `score()` function in `lib.rs` is the only place that converts errors to `Err(JsValue)`. Do not use `unwrap()` or `expect()` on data that originates from the browser.

## Numerical correctness

The Rust calculations are a port of `FoodTableCalculations.ts`. Any change to a formula must be reflected in the TypeScript original (or vice versa) and noted with a comment referencing the TS function name. Constants like `GWP_CH4 = 28.0` and `GWP_N2O = 265.0` are not estimates — do not change them without a source citation.

## Build

The crate compiles to `cdylib` for WASM. Run `wasm-pack build --target web` to produce the `pkg/` output consumed by `apps/web`. The release profile uses `opt-level = "s"` for size — do not change this without measuring the impact on the browser bundle.

## Dead code

`#[allow(dead_code)]` on `FoodRow` is intentional: the struct mirrors the full API response so that new calculations can use any field without a schema change. Do not remove unused fields from `FoodRow` — mark them with a comment explaining which future calculation will use them, or raise the question before removing.
