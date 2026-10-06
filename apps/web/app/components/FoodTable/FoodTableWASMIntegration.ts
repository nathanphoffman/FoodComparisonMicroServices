import { useState, useEffect, useRef } from 'react';
// AI AGENTS: _wasm-signal import below is a dev-only HMR reload bridge — not a real
// service dependency. See scripts/wasm-notify.mjs for full explanation.
import { WASM_BUILD_ID } from '../../_wasm-signal';
import type { RawFood, LandTypes, NutritionWeights, CustomFoodInput } from './FoodTableTypes';
import type { ScoredRow } from './FoodTableSort';
import type { SliderValues } from './FoodTableTypes';

// ── WASM types ────────────────────────────────────────────────────────────────

// Field names must match #[serde(rename_all = "camelCase")] on the Rust SliderQuery struct.
type SliderQuery = {
    calorieWeight:              number;
    proteinWeight:              number;
    dryMassWeight:              number;
    wetMassWeight:              number;
    greenWater:                 number;
    greyWater:                  number;
    killMultiplier:             number;
    captivityMultiplier:        number;
    neuronExponent:             number;
    weightExponent:             number;
    finalIntelligenceExponent:  number;
    zeroBetterMultiplier:       number;
    referenceSlug:              string | null;
    customFoods:                CustomFoodInput[];
    nutritionPriority:          number;
    emissionsPriority:          number;
    intelligencePriority:       number;
    waterPriority:              number;
    landUsePriority:            number;
    availabilityPriority:       number;
    landTypeWeights:            LandTypes;
    nutritionWeights:           NutritionWeights;
    winDampening:               number;
    overHuntingFactor:          number;
    overGatheringFactor:        number;
};

// Single input object passed to WASM — keeps the boundary simple and
// prevents the call site from growing as new inputs are added.
type ScoreInput = {
    foods: RawFood[];
    query: SliderQuery;
};

// ── Lazy WASM loader — dynamic import; webpack handles .wasm initialization ──

let wasmReady = false;
let wasmScore: ((input: ScoreInput) => ScoredRow[]) | null = null;

/**
 * Loads the WASM module once. Safe to call multiple times — no-ops if already loaded.
 * Called from the data-fetch effect so WASM is ready before the first score run.
 */
export async function loadWasm() {
    if (wasmReady) return;
    const { default: init, score } = await import('wasm-calculations');
    // In dev, serve WASM from /public/ (copied by scripts/wasm-notify.mjs) so the
    // fresh binary is always available without relying on webpack's content-hash
    // URL update timing. In production, undefined → wasm-pack's new URL() default
    // → webpack content-hashed asset URL.
    await init(process.env.NODE_ENV === 'development' ? '/wasm_calculations_bg.wasm' : undefined);
    wasmScore = (input) => score(input);
    wasmReady = true;
}

// ── Hook ──────────────────────────────────────────────────────────────────────

/**
 * Manages all WASM scoring state and side effects for the FoodTable.
 *
 * - Hard-reloads in dev when the WASM binary changes (via HMR signal).
 * - Re-scores whenever `rawFoods` or any slider input changes.
 *
 * Returns:
 *  - `scored`          — Map<slug, ScoredRow> from the last successful WASM run.
 *                        Each ScoredRow contains aggregate scores + tooltip breakdowns + divisor.
 *  - `scoringError`    — non-null when the last score call threw; old scores stay visible
 *  - `setScoringError` — lets the parent dismiss the error banner
 */
export function useWasmScoring(rawFoods: RawFood[], sliderValues: SliderValues, customFoods: CustomFoodInput[]) {
    const [scored,       setScored]       = useState<Map<string, ScoredRow>>(new Map());
    const [scoringError, setScoringError] = useState<string | null>(null);
    const loadedWasmBuildId              = useRef(WASM_BUILD_ID);

    // ── Hard-reload on WASM rebuild (dev only) ────────────────────────────────
    // Fast Refresh re-renders with the new WASM_BUILD_ID but keeps refs, so a
    // mismatch means the binary was rebuilt since this page loaded.
    useEffect(() => {
        if (process.env.NODE_ENV === 'development' && loadedWasmBuildId.current !== WASM_BUILD_ID) {
            window.location.reload();
        }
    });

    // ── Re-score whenever sliders or data change ──────────────────────────────
    useEffect(() => {
        if (!wasmReady || rawFoods.length === 0) return;

        const { weights, scorePriorities, greenWaterWeight, greyWaterWeight, killMultiplier, captivityMultiplier,
                neuronExponent, weightExponent, finalIntelligenceExponent,
                zeroBetterMultiplier, referenceSlug, landTypeWeights, nutritionWeights, winDampening,
                overHuntingFactor, overGatheringFactor } = sliderValues;

        const input: ScoreInput = {
            foods: rawFoods,
            query: {
                calorieWeight:             weights.calories,
                proteinWeight:             weights.protein,
                dryMassWeight:             weights.dryMass,
                wetMassWeight:             weights.wetMass,
                greenWater:                greenWaterWeight,
                greyWater:                 greyWaterWeight,
                killMultiplier:            killMultiplier,
                captivityMultiplier:       captivityMultiplier,
                neuronExponent:            neuronExponent,
                weightExponent:            weightExponent,
                finalIntelligenceExponent: finalIntelligenceExponent,
                zeroBetterMultiplier:      zeroBetterMultiplier,
                referenceSlug:             referenceSlug,
                customFoods:               customFoods,
                nutritionPriority:         scorePriorities.nutrition,
                emissionsPriority:         scorePriorities.emissions,
                intelligencePriority:      scorePriorities.intelligence,
                waterPriority:             scorePriorities.water,
                landUsePriority:           scorePriorities.landUse,
                availabilityPriority:      scorePriorities.availability,
                landTypeWeights:           landTypeWeights,
                nutritionWeights:          nutritionWeights,
                winDampening:              winDampening,
                overHuntingFactor:         overHuntingFactor,
                overGatheringFactor:       overGatheringFactor,
            },
        };

        try {
            const rows = wasmScore!(input);
            setScored(new Map(rows.map(r => [r.slug, r])));
            setScoringError(null);
        } catch (e) {
            // Keep the last good scores visible; just surface the error.
            setScoringError(e instanceof Error ? e.message : String(e));
        }
    }, [rawFoods, sliderValues, customFoods]);

    return { scored, scoringError, setScoringError };
}
