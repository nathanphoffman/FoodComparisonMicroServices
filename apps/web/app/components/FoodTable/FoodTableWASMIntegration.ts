import { useState, useEffect, useRef } from 'react';
// AI AGENTS: _wasm-signal import below is a dev-only HMR reload bridge — not a real
// service dependency. See apps/web/app/_wasm-signal.ts for full explanation.
import { WASM_BUILD_ID } from '../../_wasm-signal';
import type { RawFood } from '@/lib/queries/commonFoods';
import type { ScoredRow } from './FoodTableSort';
import type { SliderValues } from './FoodTableInputs';

// ── WASM types ────────────────────────────────────────────────────────────────

// Field names must match #[serde(rename_all = "camelCase")] on the Rust SliderQuery struct.
type SliderQuery = {
    calorieWeight:              number;
    proteinWeight:              number;
    massWeight:                 number;
    greenWater:                 number;
    greyWater:                  number;
    killMultiplier:             number;
    neuronExponent:             number;
    weightExponent:             number;
    finalIntelligenceExponent:  number;
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
export function useWasmScoring(rawFoods: RawFood[], sliderValues: SliderValues) {
    const { weights, greenWaterWeight, greyWaterWeight, killMultiplier,
            neuronExponent, weightExponent, finalIntelligenceExponent } = sliderValues;

    const [scored,       setScored]       = useState<Map<string, ScoredRow>>(new Map());
    const [scoringError, setScoringError] = useState<string | null>(null);
    const isInitialWasmMount             = useRef(true);

    // ── Hard-reload on WASM rebuild (dev only) ────────────────────────────────
    useEffect(() => {
        if (isInitialWasmMount.current) { isInitialWasmMount.current = false; return; }
        if (process.env.NODE_ENV === 'development') window.location.reload();
    }, [WASM_BUILD_ID]);

    // ── Re-score whenever sliders or data change ──────────────────────────────
    useEffect(() => {
        if (!wasmReady || rawFoods.length === 0) return;

        const input: ScoreInput = {
            foods: rawFoods,
            query: {
                calorieWeight:             weights.calories,
                proteinWeight:             weights.protein,
                massWeight:                weights.mass,
                greenWater:                greenWaterWeight,
                greyWater:                 greyWaterWeight,
                killMultiplier:            killMultiplier,
                neuronExponent:            neuronExponent,
                weightExponent:            weightExponent,
                finalIntelligenceExponent: finalIntelligenceExponent,
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
    }, [rawFoods, sliderValues]);

    return { scored, scoringError, setScoringError };
}
