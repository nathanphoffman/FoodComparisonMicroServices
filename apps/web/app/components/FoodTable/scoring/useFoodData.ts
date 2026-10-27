import { useState, useEffect } from 'react';
import type { RawFood, DataRegion } from '../types/FoodTableTypes';
import { loadWasm } from './FoodTableWASMIntegration';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:5050';

/** Loads the WASM module and the raw foods from the C# API on mount and whenever the data region changes. */
export function useFoodData(dataRegion: DataRegion) {
    const [rawFoods, setRawFoods]     = useState<RawFood[]>([]);
    const [loadingApi, setLoadingApi] = useState(true);
    const [error, setError]           = useState<string | null>(null);

    useEffect(() => {
        let cancelled = false;

        async function fetchFoods() {
            try {
                await loadWasm();
                const response = await fetch(`${API_URL}/api/foods?region=${dataRegion}`);

                if (!response.ok) throw new Error(`API error ${response.status}`);
                const foods: RawFood[] = await response.json();

                if (cancelled) return;
                setRawFoods(foods);
            } catch (fetchError) {
                console.error('Could not load the foods:', fetchError);

                if (!cancelled) setError(String(fetchError));
            } finally {
                if (!cancelled) setLoadingApi(false);
            }
        }

        fetchFoods();

        return () => { cancelled = true; };
    }, [dataRegion]);

    return { rawFoods, loadingApi, error };
}
