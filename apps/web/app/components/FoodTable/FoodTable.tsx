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
    EcoDestructionCell,
    FinalScoreCell,
    DummyCell,
} from './FoodTableFields';
import type { FoodEthics } from './FoodTableTypes';
import { mapRawFoodToFoodEthics, getUnitLabel } from './FoodTableCalculations';
import type { RawFood } from '@/lib/queries/commonFoods';
import { useFoodTableSort } from './FoodTableSort';
import { loadWasm, useWasmScoring } from './FoodTableWASMIntegration';
import { FoodTableInputs, COLUMN_CONFIG, DEFAULT_SLIDER_VALUES } from './FoodTableInputs';
import type { ColConfig, SliderValues } from './FoodTableInputs';

// ── Component ─────────────────────────────────────────────────────────────────

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:5000';

export function FoodTable() {
    // Data state
    const [rawFoods, setRawFoods] = useState<RawFood[]>([]);
    const [ethics,   setEthics]   = useState<FoodEthics[]>([]);
    const [loading,  setLoading]  = useState(true);
    const [error,    setError]    = useState<string | null>(null);

    // Slider state — owned by FoodTableInputs, received here as a single object
    const [sliderValues, setSliderValues] = useState<SliderValues>(DEFAULT_SLIDER_VALUES);

    // WASM scoring (scored rows, eco-destruction divisors, scoring error)
    const { scored, ecoDivisors, scoringError, setScoringError } = useWasmScoring(rawFoods, sliderValues);

    // Sort state
    const { columnSortProps, sortRows } = useFoodTableSort();

    // UI state — activeCols is updated synchronously by FoodTableInputs via onActiveColsChange
    const [activeCols, setActiveCols] = useState<ColConfig[]>(
        () => COLUMN_CONFIG.filter(c => c.defaultVisible)
    );

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

    // ── Sort rows using WASM-scored values ────────────────────────────────────

    const sorted = sortRows(ethics, scored);

    // ── Render ────────────────────────────────────────────────────────────────

    const { weights, greenWaterWeight, greyWaterWeight } = sliderValues;
    const unit = getUnitLabel(weights);
    const DYNAMIC_LABELS: Partial<Record<ColConfig['key'], string>> = {
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
            <FoodTableInputs
                onSliderValuesChange={setSliderValues}
                scoringError={scoringError}
                onDismissScoringError={() => setScoringError(null)}
                onActiveColsChange={setActiveCols}
            />
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
