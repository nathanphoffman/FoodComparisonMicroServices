---
name: food-table
description: Responsible for all files in the FoodTable, Inputs, and Table directories within apps/web/app/components/.
---

## What you own

`apps/web/app/components/FoodTable/`, `apps/web/app/components/Inputs/`, `apps/web/app/components/Table/`

The FoodTable directory is split across several files by concern: types, calculations, styles, field components, tooltips, sliders, and the main table. `FoodTableFields.tsx` is allowed to define multiple components.

## How the pieces fit together

Types live in `FoodTableTypes.ts`. All color and format logic goes in `FoodTableCalculations.ts` using named threshold constants — never inline color logic elsewhere. Shared Tailwind class strings belong in `FoodTableStyles.ts`. Display components and cell wrappers are in `FoodTableFields.tsx`, tooltip content in `FoodTableTooltips.tsx`, and user-adjustable sliders in `FoodTableSliders.tsx`. The main `FoodTable.tsx` fetches food data from the C# API (`GET /api/foods`), scores rows using the Rust WASM module (`services/wasm-calculations/`), and manages sort/visibility state.

## How scoring works

`FoodTable.tsx` fetches raw `FoodRow[]` from the C# API once on mount. On every slider change it calls `score(foods, sliderQuery)` from `wasm-calculations` (Rust WASM, compiled to `services/wasm-calculations/pkg/`). The returned `ScoredRow[]` drives cell values and sorting. `FoodTableCalculations.ts` handles display utilities (`mapRawFoodToFoodEthics`, `formatNeurons`, `computeEcoDestruction`) — not scoring math.

## Adding a column

When adding a column, work through the files in order: define the `*Detail` type, add color and format functions, build the `*Value` and `*Cell` components, write the tooltip, then wire everything into `FoodEthics`, the type unions, `COLUMN_CONFIG`, and the render switch. If the column needs slider-driven weighting, also add the calculation to `services/wasm-calculations/src/calculations.rs` and rebuild WASM with `npm run build:wasm`.

## A few things to keep in mind

The `dummy` column in `FoodTable.tsx` is a dev fixture — leave it in place with `defaultVisible: false`. Use Tailwind for all styling.
