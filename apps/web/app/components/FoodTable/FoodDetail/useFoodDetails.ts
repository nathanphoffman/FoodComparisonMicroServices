import { useEffect, useState } from 'react';
import type { FoodDetails } from '@/lib/types';

/** Loads a food's notes and sources; `loadError` is set if that fails. */
export function useFoodDetails(slug: string) {
  const [details, setDetails] = useState<FoodDetails | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    fetch(`/api/foods/${encodeURIComponent(slug)}/details`, { signal: controller.signal })
      .then(response => {
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return response.json() as Promise<FoodDetails>;
      })
      .then(setDetails)
      .catch(error => { if (!controller.signal.aborted) setLoadError(String(error)); });
    return () => controller.abort();
  }, [slug]);

  return { details, loadError };
}
