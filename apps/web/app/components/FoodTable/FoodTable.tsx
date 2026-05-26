'use client';

import { useState, useRef, useEffect } from 'react';
import { Table } from '../Table/Table';
import { Row } from '../Table/Row';
import {
    NameCell,
    NutritionScoreCell,
    EmissionsCell,
    LandUseCell,
    IntelligenceCell,
    WaterCell,
    EcoDestructionCell,
    FinalScoreCell,
    DummyCell,
} from './FoodTableFields';
import type { FoodEthics, FoodWeights } from './FoodTableTypes';
import { FoodTableSliders } from './FoodTableSliders';
import { mapRawFoodToFoodEthics, getUnitLabel, computeEcoDivisor } from './FoodTableCalculations';
import type { RawFood } from '@/lib/queries/commonFoods';

// ── WASM scoring types ────────────────────────────────────────────────────────

type ScoredRow = {
    slug:            string;
    name:            string;
    food_type:       string;
    nutrition_score: number | null;
    emissions:       number | null;
    land_use:        number | null;
    water:           number | null;
    direct_kill:     number | null;
    eco_destruction: number | null;
    final_score:     number | null;
};

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
// AI AGENTS: _wasm-signal import below is a dev-only HMR reload bridge — not a real
// service dependency. See apps/web/app/_wasm-signal.ts for full explanation.
import { WASM_BUILD_ID } from '../../_wasm-signal';

let wasmReady = false;
let wasmScore: ((foods: RawFood[], query: SliderQuery) => ScoredRow[]) | null = null;

async function loadWasm() {
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

// ── Column config ─────────────────────────────────────────────────────────────

type SortKey = 'name' | 'nutritionScore' | 'emissions' | 'landUse' | 'directKill' | 'water' | 'ecoDestruction' | 'finalScore';
type ColumnKey = SortKey | 'dummy';

const COLUMN_CONFIG: { key: ColumnKey; label: string; sortKey?: SortKey; defaultVisible: boolean }[] = [
    { key: 'name',           label: 'Food',               sortKey: 'name',           defaultVisible: true  },
    { key: 'nutritionScore', label: 'Nutrition Score',     sortKey: 'nutritionScore', defaultVisible: true  },
    { key: 'emissions',      label: 'CO₂e (kg / kg)',      sortKey: 'emissions',      defaultVisible: true  },
    { key: 'landUse',        label: 'Land Use (m² / kg)',  sortKey: 'landUse',        defaultVisible: true  },
    { key: 'directKill',     label: 'Direct Kill',          sortKey: 'directKill',     defaultVisible: true  },
    { key: 'water',          label: 'Water (L / kg)',       sortKey: 'water',          defaultVisible: true  },
    { key: 'ecoDestruction', label: 'Eco Destruction',      sortKey: 'ecoDestruction', defaultVisible: true  },
    { key: 'finalScore',     label: 'Final Score',           sortKey: 'finalScore',     defaultVisible: true  },
    { key: 'dummy',          label: 'Test Column',          sortKey: undefined,        defaultVisible: false },
];

// ── Component ─────────────────────────────────────────────────────────────────

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:5000';

export function FoodTable() {
    // Data state
    const [rawFoods, setRawFoods]   = useState<RawFood[]>([]);
    const [ethics, setEthics]       = useState<FoodEthics[]>([]);
    const [scored, setScored]       = useState<Map<string, ScoredRow>>(new Map());
    const [loading, setLoading]     = useState(true);
    const [error, setError]         = useState<string | null>(null);
    // Separate from fetch error — non-blocking, shown as a banner while old scores stay visible.
    const [scoringError, setScoringError] = useState<string | null>(null);

    // Eco destruction tooltip divisors — keyed by slug, updated with sliders
    const [ecoDivisors, setEcoDivisors]     = useState<Map<string, number>>(new Map());

    // Slider state
    const [weights, setWeights]             = useState<FoodWeights>({ calories: 34, protein: 33, mass: 33 });
    const [greenWaterWeight, setGreenWater] = useState(25);
    const [greyWaterWeight, setGreyWater]   = useState(25);
    const [killMultiplier, setKillMult]     = useState(1);

    // UI state
    const [sortKey, setSortKey]        = useState<SortKey | null>(null);
    const [sortDir, setSortDir]        = useState<'asc' | 'desc'>('asc');
    const [visibleColumns, setVisible] = useState<Set<ColumnKey>>(
        () => new Set(COLUMN_CONFIG.filter(c => c.defaultVisible).map(c => c.key))
    );
    const [showToggle, setShowToggle]  = useState(false);
    const toggleRef                    = useRef<HTMLDivElement>(null);
    const isInitialWasmMount           = useRef(true);

    // ── Hard-reload on WASM rebuild (dev only) ────────────────────────────────
    // Fast Refresh re-renders this component when _wasm-signal.ts changes.
    // wasmReady is module-level so it survives soft re-renders — a hard reload
    // is the only way to reset it and pick up the fresh binary from /public/.
    useEffect(() => {
        if (isInitialWasmMount.current) { isInitialWasmMount.current = false; return; }
        if (process.env.NODE_ENV === 'development') window.location.reload();
    }, [WASM_BUILD_ID]);

    // ── Fetch raw foods from C# API on mount ─────────────────────────────────

    useEffect(() => {
        let cancelled = false;
        async function fetchFoods() {
            try {
                await loadWasm();
                const res = await fetch(`${API_URL}/api/foods`);
                if (!res.ok) throw new Error(`API error ${res.status}`);
                const foods: RawFood[] = await res.json();
                if (cancelled) return;
                setRawFoods(foods);
                setEthics(foods.map(mapRawFoodToFoodEthics));
            } catch (e) {
                if (!cancelled) setError(String(e));
            } finally {
                if (!cancelled) setLoading(false);
            }
        }
        fetchFoods();
        return () => { cancelled = true; };
    }, []);

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
            setScoringError(
                e instanceof Error ? e.message : String(e)
            );
        }
    }, [rawFoods, weights, greenWaterWeight, greyWaterWeight, killMultiplier]);

    // ── Click-outside for column toggle ──────────────────────────────────────

    useEffect(() => {
        function onClickOutside(e: MouseEvent) {
            if (toggleRef.current && !toggleRef.current.contains(e.target as Node)) {
                setShowToggle(false);
            }
        }
        document.addEventListener('mousedown', onClickOutside);
        return () => document.removeEventListener('mousedown', onClickOutside);
    }, []);

    // ── Sort helpers ──────────────────────────────────────────────────────────

    function handleSort(key: SortKey) {
        if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
        else { setSortKey(key); setSortDir('asc'); }
    }

    function columnSortProps(key: SortKey) {
        return { sorted: sortKey === key ? sortDir : undefined, onSort: () => handleSort(key) };
    }

    function toggleColumn(key: ColumnKey) {
        setVisible(prev => {
            const next = new Set(prev);
            next.has(key) ? next.delete(key) : next.add(key);
            return next;
        });
    }

    // ── Sort rows using WASM-scored values ────────────────────────────────────

    //const SCORED_SORT_KEYS = new Set<SortKey>(['emissions', 'landUse', 'directKill', 'water', 'finalScore']);

    const sorted = sortKey
        ? [...ethics].sort((a, b) => {
            const sa = scored.get(a.slug);
            const sb = scored.get(b.slug);

            let va: number | string | null = null;
            let vb: number | string | null = null;

            if (sortKey === 'name') {
                va = a.name; vb = b.name;
            } else if (sortKey === 'nutritionScore') {
                va = a.nutritionScore; vb = b.nutritionScore;
            } else if (sa && sb) {
                va = sortKey === 'emissions'      ? sa.emissions
                   : sortKey === 'landUse'        ? sa.land_use
                   : sortKey === 'directKill'     ? sa.direct_kill
                   : sortKey === 'water'          ? sa.water
                   : sortKey === 'ecoDestruction' ? sa.eco_destruction
                   : sortKey === 'finalScore'     ? sa.final_score
                   : null;
                vb = sortKey === 'emissions'      ? sb.emissions
                   : sortKey === 'landUse'        ? sb.land_use
                   : sortKey === 'directKill'     ? sb.direct_kill
                   : sortKey === 'water'          ? sb.water
                   : sortKey === 'ecoDestruction' ? sb.eco_destruction
                   : sortKey === 'finalScore'     ? sb.final_score
                   : null;
            }

            if (va === null && vb === null) return 0;
            if (va === null) return 1;
            if (vb === null) return -1;
            if (va === vb) return 0;
            const cmp = va < vb ? -1 : 1;
            return sortDir === 'asc' ? cmp : -cmp;
        })
        : ethics;

    // ── Render ────────────────────────────────────────────────────────────────

    const activeCols = COLUMN_CONFIG.filter(c => visibleColumns.has(c.key));
    const unit = getUnitLabel(weights);
    const DYNAMIC_LABELS: Partial<Record<ColumnKey, string>> = {
        emissions:      `CO₂e (kg / ${unit})`,
        landUse:        `Land Use (m² / ${unit})`,
        directKill:     `Direct Kill / ${unit}`,
        water:          `Water (L / ${unit})`,
        ecoDestruction: `Eco Destruction / ${unit}`,
    };

    const headers = activeCols.map(c => ({
        label: DYNAMIC_LABELS[c.key] ?? c.label,
        ...(c.sortKey ? columnSortProps(c.sortKey) : {}),
    }));

    if (loading) return <p className="mt-6 text-neutral-500">Loading food data…</p>;
    if (error)   return <p className="mt-6 text-red-600">Failed to load data: {error}</p>;

    return (
        <div className="mt-6">
            <FoodTableSliders
                onChange={setWeights}
                onGreenWaterChange={setGreenWater}
                onGreyWaterChange={setGreyWater}
                onPhilosophicalKillChange={setKillMult}
            />
            {scoringError && (
                <div className="flex items-start justify-between gap-3 mb-3 px-4 py-3 rounded-md bg-red-50 border border-red-200 text-red-700 text-sm">
                    <div>
                        <span className="font-medium">Scoring error — </span>
                        scores may be stale. {scoringError}
                    </div>
                    <button
                        onClick={() => setScoringError(null)}
                        className="shrink-0 text-red-400 hover:text-red-600 leading-none text-base"
                        aria-label="Dismiss"
                    >✕</button>
                </div>
            )}
            <div className="flex justify-end mb-2" ref={toggleRef}>
                <div className="relative">
                    <button
                        onClick={() => setShowToggle(v => !v)}
                        className="text-sm text-neutral-500 hover:text-neutral-700 border border-neutral-200 rounded px-3 py-1 flex items-center gap-1"
                    >
                        Columns <span className="text-xs">{showToggle ? '▴' : '▾'}</span>
                    </button>
                    {showToggle && (
                        <div className="absolute right-0 top-full mt-1 bg-white border border-neutral-200 rounded shadow-md p-3 space-y-2 z-10 min-w-[160px]">
                            {COLUMN_CONFIG.filter(c => c.key !== 'name').map(col => (
                                <label key={col.key} className="flex items-center gap-2 text-sm cursor-pointer text-neutral-700">
                                    <input
                                        type="checkbox"
                                        checked={visibleColumns.has(col.key)}
                                        onChange={() => toggleColumn(col.key)}
                                        className="accent-neutral-700"
                                    />
                                    {col.label}
                                </label>
                            ))}
                        </div>
                    )}
                </div>
            </div>
            <Table headers={headers}>
                {sorted.map(food => {
                    const s = scored.get(food.slug);
                    return (
                        <Row key={food.slug}>
                            {activeCols.map(col => {
                                switch (col.key) {
                                    case 'name':           return <NameCell           key="name"           name={food.name} slug={food.slug} />;
                                    case 'nutritionScore': return <NutritionScoreCell key="nutritionScore" score={food.nutritionScore} detail={food.nutritionDetail} />;
                                    case 'emissions':      return <EmissionsCell      key="emissions"      value={s?.emissions ?? null} breakdown={food.emissionsBreakdown} divisor={1} />;
                                    case 'landUse':        return <LandUseCell        key="landUse"        value={s?.land_use ?? null} detail={food.landUseDetail} divisor={1} unit={unit} />;
                                    case 'directKill':     return <IntelligenceCell   key="directKill"     value={s?.direct_kill ?? null} detail={food.intelligenceDetail} />;
                                    case 'water':          return <WaterCell          key="water"          value={s?.water ?? null} detail={food.waterDetail} referenceTotal={food.water} divisor={1} unit={unit} greenWaterWeight={greenWaterWeight} greyWaterWeight={greyWaterWeight} />;
                                    case 'ecoDestruction': return <EcoDestructionCell key="ecoDestruction" value={s?.eco_destruction ?? null} detail={food.ecoDestructionDetail} divisor={ecoDivisors.get(food.slug) ?? 1} />;
                                    case 'finalScore':     return <FinalScoreCell     key="finalScore"     score={s?.final_score ?? null} />;
                                    case 'dummy':          return <DummyCell          key="dummy" />;
                                }
                            })}
                        </Row>
                    );
                })}
            </Table>
        </div>
    );
}
