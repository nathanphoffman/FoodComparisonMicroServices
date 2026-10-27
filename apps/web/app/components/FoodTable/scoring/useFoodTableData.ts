import { useCallback, useEffect, useState } from 'react';
import type { DataRegion, SliderValues } from '../types/FoodTableTypes';
import { useDiet } from '../diet/useDiet';
import { useWasmScoring } from './FoodTableWASMIntegration';
import { useFoodData } from './useFoodData';

/** Loads the foods for a region, scores them (and the diet being planned) with the current sliders, and reports when it's ready to show. */
export function useFoodTableData(dataRegion: DataRegion, sliderValues: SliderValues) {
    const { rawFoods, loadingApi, error } = useFoodData(dataRegion);
    const diet = useDiet(rawFoods);

    // Scored rows contain all scores, breakdowns, and divisors.
    const { scored, scoringError, setScoringError } = useWasmScoring(rawFoods, sliderValues, diet.scoredDiets);
    const dismissScoringError = useCallback(() => setScoringError(null), [setScoringError]);

    const [hasScores, setHasScores] = useState(false);
    useEffect(() => {
        if (scored.size > 0) setHasScores(true);
    }, [scored]);

    return { rawFoods, error, loading: loadingApi || !hasScores, scored, scoringError, dismissScoringError, ...diet };
}

export type FoodTableData = ReturnType<typeof useFoodTableData>;
