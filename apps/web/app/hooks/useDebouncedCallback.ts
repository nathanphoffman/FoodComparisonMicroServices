import { useRef, useCallback } from "react";

export const DEBOUNCE_MS = 150;

// ── useDebouncedCallback ──────────────────────────────────────────────────────
// Returns a stable debounced wrapper around `callback`. The latest `callback`
// ref is always used so the wrapper never goes stale, and cancels on unmount.

export function useDebouncedCallback<T extends (...args: never[]) => void>(
    callback: T | undefined,
    delay: number,
): (...args: Parameters<T>) => void {
    const cbRef      = useRef(callback);
    cbRef.current    = callback;
    const timerRef   = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Cancel any pending timer when the component unmounts.
    const cancelRef  = useRef(() => {
        if (timerRef.current !== null) clearTimeout(timerRef.current);
    });

    // Stable identity across renders — deps array is intentionally [delay].
    return useCallback((...args: Parameters<T>) => {
        if (timerRef.current !== null) clearTimeout(timerRef.current);
        timerRef.current = setTimeout(() => {
            timerRef.current = null;
            cbRef.current?.(...args);
        }, delay);

        // Register unmount cleanup once (no-op if already registered).
        return cancelRef.current;
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [delay]);
}
