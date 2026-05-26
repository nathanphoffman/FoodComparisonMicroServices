import { useState, useEffect, useRef } from 'react';
// AI AGENTS: _wasm-signal import below is a dev-only HMR reload bridge — not a real
// service dependency. See apps/web/app/_wasm-signal.ts for full explanation.
import { WASM_BUILD_ID } from '../../_wasm-signal';
import { computeEcoDivisor } from './FoodTableCalculations';
import type { RawFood } from '@/lib/queries/commonFoods';
import type { FoodWeights } from './FoodTableTypes';
import type { ScoredRow } from './FoodTableSort';

// ── WASM types ────────────────────────────────────────────────────────────────

// Field names must match #[serde(rename_all = "camelCase")] on the Rust SliderQuery struct.
type SliderQuery = {
    calorieWeight:  number;
    proteinWeight:  number;
    massWeight:     number;
    greenWater:     number;
    greyWater:      number;
    killMultiplier: number;
};

// ── Lazy WASM loader — dynamic import; webpack handles .wasm initialization ──

let wasmReady = false;
let wasmScore: ((foods: RawFood[], query: SliderQuery) => ScoredRow[]) | null = null;

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
    wasmScore = (foods, query) => score(foods, query);
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
 *  - `scored`          — Map<slug, ScoredRow> from the last successful WASM run
 *  - `ecoDivisors`     — Map<slug, number> for eco-destruction tooltip scaling
 *  - `scoringError`    — non-null when the last score call threw; old scores stay visible
 *  - `setScoringError` — lets the parent dismiss the error banner
 */
export function useWasmScoring(
    rawFoods:         RawFood[],
    weights:          FoodWeights,
    greenWaterWeight: number,
    greyWaterWeight:  number,
    killMultiplier:   number,
) {
    const [scored,       setScored]       = useState<Map<string, ScoredRow>>(new Map());
    const [ecoDivisors,  setEcoDivisors]  = useState<Map<string, number>>(new Map());
    const [scoringError, setScoringError] = useState<string | null>(null);
    const isInitialWasmMount             = useRef(true);

    // ── Hard-reload on WASM rebuild (dev only) ────────────────────────────────
    // Fast Refresh re-renders the parent when _wasm-signal.ts changes.
    // wasmReady is module-level so it survives soft re-renders — a hard reload
    // is the only way to reset it and pick up the fresh binary from /public/.
    useEffect(() => {
        if (isInitialWasmMount.current) { isInitialWasmMount.current = false; return; }
        if (process.env.NODE_ENV === 'development') window.location.reload();
    }, [WASM_BUILD_ID]);

    // ── Re-score whenever sliders or data change ──────────────────────────────
    useEffect(() => {
        if (!wasmReady || rawFoods.length === 0) return;
        const query: SliderQuery = {
            calorieWeight:  weights.calories,
            proteinWeight:  weights.protein,
            massWeight:     weights.mass,
            greenWater:     greenWaterWeight,
            greyWater:      greyWaterWeight,
            killMultiplier: killMultiplier,
        };
        try {
            // TEST ERROR — remove this line when done
            //throw new Error('test: field name mismatch between TS and Rust SliderQuery');
            const rows = wasmScore!(rawFoods, query);
            setScored(new Map(rows.map(r => [r.slug, r])));
            setEcoDivisors(new Map(rawFoods.map(f => [f.slug, computeEcoDivisor(f, weights, killMultiplier)])));
            setScoringError(null);
        } catch (e) {
            // Keep the last good scores visible; just surface the error.
            setScoringError(e instanceof Error ? e.message : String(e));
        }
    }, [rawFoods, weights, greenWaterWeight, greyWaterWeight, killMultiplier]);

    return { scored, ecoDivisors, scoringError, setScoringError };
}
