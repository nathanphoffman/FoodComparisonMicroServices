import { useState, useEffect, useRef } from 'react';

// AI AGENTS: _wasm-signal import below is a dev-only HMR reload bridge — not a real
// service dependency. See scripts/wasm-notify.mjs for full explanation.
import { WASM_BUILD_ID } from '../../../_wasm-signal';
import type { RawFood, DietInput, SliderValues } from '../types/FoodTableTypes';
import type { ScoredRow } from '../types/FoodTableTypes';
import { buildScoreInput, type ScoreInput } from './FoodTableWasmQuery';

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
export function useWasmScoring(rawFoods: RawFood[], sliderValues: SliderValues, diets: DietInput[]) {
    const [scored,       setScored]       = useState<Map<string, ScoredRow>>(new Map());
    const [scoringError, setScoringError] = useState<string | null>(null);
    const loadedWasmBuildId              = useRef(WASM_BUILD_ID);

    // Hard-reload on WASM rebuild (dev only): Fast Refresh re-renders with the new WASM_BUILD_ID but keeps refs, so a
    // mismatch means the binary was rebuilt since this page loaded.
    useEffect(() => {
        if (process.env.NODE_ENV === 'development' && loadedWasmBuildId.current !== WASM_BUILD_ID) {
            window.location.reload();
        }
    });

    // Re-score whenever sliders or data change.
    useEffect(() => {
        if (!wasmReady || rawFoods.length === 0) return;

        const input = buildScoreInput(rawFoods, sliderValues, diets);

        try {
            const rows = wasmScore!(input);
            setScored(new Map(rows.map(row => [row.slug, row])));
            setScoringError(null);
        } catch (error) {
            // Keep the last good scores visible; just surface the error.
            console.error('Scoring failed:', error);
            setScoringError(error instanceof Error ? error.message : String(error));
        }
    }, [rawFoods, sliderValues, diets]);

    return { scored, scoringError, setScoringError };
}
