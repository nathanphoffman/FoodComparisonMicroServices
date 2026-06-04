'use client';

import { useState, useEffect } from 'react';
import { Table } from '../Table/Table';
import { Row } from '../Table/Row';
import {
    NameCell,
    NutritionScoreCell,
    EmissionsCell,
    LandUseCell,
    IntelligenceCell,
    WaterCell,
    SentientHarmCell,
    FinalScoreCell,
    DummyCell,
} from './FoodTableFields';
import { getUnitLabel, toNutritionDetail, toIntelligenceDetail } from './FoodTableCalculations';
import type { RawFood } from '@/lib/queries/commonFoods';
import { useFoodTableSort } from './FoodTableSort';
import { loadWasm, useWasmScoring } from './FoodTableWASMIntegration';
import { FoodTableInputs, COLUMN_CONFIG, DEFAULT_SLIDER_VALUES } from './FoodTableInputs';
import type { ColConfig, SliderValues } from './FoodTableInputs';
import { EMPTY_SENTIENT_HARM_DETAIL } from './FoodTableTypes';
import type { ScoredRow } from './FoodTableSort';

// ── Improvement ratio ─────────────────────────────────────────────────────────

function computeImprovement(food: ScoredRow, ref: ScoredRow): number | null {
    const ratios: number[] = [];

    function addLower(a: number | null, b: number | null) {
        if (a != null && b != null && a > 0 && b > 0) ratios.push(b / a);
    }
    function addHigher(a: number | null, b: number | null) {
        if (a != null && b != null && a > 0 && b > 0) ratios.push(a / b);
    }

    addLower(food.emissions,     ref.emissions);
    addLower(food.land_use,      ref.land_use);
    addLower(food.water,         ref.water);
    addLower(food.direct_kill,   ref.direct_kill);
    addLower(food.sentient_harm, ref.sentient_harm);
    addHigher(food.nutrition_score, ref.nutrition_score);

    if (ratios.length === 0) return null;
    const logSum = ratios.reduce((s, r) => s + Math.log(r), 0);
    return Math.exp(logSum / ratios.length);
}

// ── Component ─────────────────────────────────────────────────────────────────

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:5050';

export function FoodTable() {
    // Data state
    const [rawFoods, setRawFoods] = useState<RawFood[]>([]);
    const [loadingApi,  setLoadingApi]  = useState(true);
    const [loadingScore,  setLoadingScore]  = useState(true);
    const [error,    setError]    = useState<string | null>(null);

    const [sliderValues, setSliderValues] = useState<SliderValues>(DEFAULT_SLIDER_VALUES);
    const [referenceSlug, setReferenceSlug] = useState<string>('rice');

    // WASM scoring — scored rows contain all scores, breakdowns, and divisors
    const { scored, scoringError, setScoringError } = useWasmScoring(rawFoods, sliderValues);

    // Sort state
    const { columnSortProps, sortRows } = useFoodTableSort();

    // UI state — activeCols updated synchronously by FoodTableInputs
    const [activeCols, setActiveCols] = useState<ColConfig[]>(
        () => COLUMN_CONFIG.filter(column => column.defaultVisible)
    );

    // ── Fetch raw foods from C# API on mount ─────────────────────────────────

    useEffect(()=>{
        if (scored && scored.size) setLoadingScore(false);
    },[scored]);

    useEffect(() => {
        let cancelled = false;
        async function fetchFoods() {
            try {
                await loadWasm();
                const response = await fetch(`${API_URL}/api/foods`);
                if (!response.ok) throw new Error(`API error ${response.status}`);
                const foods: RawFood[] = await response.json();
                if (cancelled) return;
                setRawFoods(foods);
            } catch (fetchError) {
                if (!cancelled) setError(String(fetchError));
            } finally {
                if (!cancelled) setLoadingApi(false);
            }
        }
        fetchFoods();
        return () => { cancelled = true; };
    }, []);

    // ── Sort rows using WASM-scored values ────────────────────────────────────

    const sorted = sortRows(rawFoods, scored);

    // ── Render ────────────────────────────────────────────────────────────────

    const { weights, greenWaterWeight, greyWaterWeight } = sliderValues;
    const unit = getUnitLabel(weights);
    const referenceName = rawFoods.find(f => f.slug === referenceSlug)?.name ?? referenceSlug;
    const referenceRow  = scored.get(referenceSlug) ?? null;
    const DYNAMIC_LABELS: Partial<Record<ColConfig['key'], string>> = {
        emissions:    `CO₂e (kg / ${unit})`,
        landUse:      `Land Use (m² / ${unit})`,
        directKill:   `Direct Kill / ${unit}`,
        water:        `Water (L / ${unit})`,
        sentientHarm: `Sentient Harm / ${unit}`,
        finalScore:   `Improvement over ${referenceName}`,
    };

    const headers = activeCols.map(column => ({
        label: DYNAMIC_LABELS[column.key] ?? column.label,
        ...(column.sortKey ? columnSortProps(column.sortKey) : {}),
    }));

    if (loadingApi || loadingScore) return <p className="mt-6 text-neutral-500">Loading food data…</p>;
    if (error)   return <p className="mt-6 text-red-600">Failed to load data: {error}</p>;

    return (
        <div className="mt-6">
            <FoodTableInputs
                onSliderValuesChange={setSliderValues}
                scoringError={scoringError}
                onDismissScoringError={() => setScoringError(null)}
                onActiveColsChange={setActiveCols}
                foods={rawFoods}
                onReferenceChange={setReferenceSlug}
            />
     
            <Table headers={headers}>
                {sorted.map(food => {
                    const scoredRow = scored.get(food.slug);
                    const referenceWater = food.type === 'animal' ? food.feed_water_per_kg : food.water_per_kg;
                    return (
                        <Row key={food.slug}>
                            {activeCols.map(column => {
                                switch (column.key) {
                                    case 'name':           return <NameCell           key="name"           name={food.name} slug={food.slug} />;
                                    case 'nutritionScore': return <NutritionScoreCell key="nutritionScore" score={scoredRow?.nutrition_score ?? null} detail={toNutritionDetail(food)} />;
                                    case 'emissions':      return <EmissionsCell      key="emissions"      value={scoredRow?.emissions ?? null} breakdown={scoredRow?.emissions_breakdown} divisor={1} />;
                                    case 'landUse':        return <LandUseCell        key="landUse"        value={scoredRow?.land_use ?? null} detail={scoredRow?.land_use_detail ?? { type: food.type, yieldKilogramsPerHectare: null, pastureHectaresPerKilogram: null, feedLandM2PerKg: null }} divisor={1} unit={unit} />;
                                    case 'directKill':     return <IntelligenceCell   key="directKill"     value={scoredRow?.direct_kill ?? null} detail={toIntelligenceDetail(food)} />;
                                    case 'water':          return <WaterCell          key="water"          value={scoredRow?.water ?? null} detail={scoredRow?.water_detail} referenceTotal={referenceWater} divisor={1} unit={unit} greenWaterWeight={greenWaterWeight} greyWaterWeight={greyWaterWeight} />;
                                    case 'sentientHarm':   return <SentientHarmCell   key="sentientHarm"   value={scoredRow?.sentient_harm ?? null} detail={scoredRow?.sentient_harm_detail ?? EMPTY_SENTIENT_HARM_DETAIL} divisor={scoredRow?.divisor ?? 1} />;
                                    case 'finalScore':     return <FinalScoreCell     key="finalScore"     ratio={scoredRow && referenceRow ? computeImprovement(scoredRow, referenceRow) : null} />;
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
