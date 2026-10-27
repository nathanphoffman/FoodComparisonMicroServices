import { useRef, useCallback, useEffect } from "react";

export const DEBOUNCE_MS = 500;

/**
 * Returns a stable debounced wrapper around `callback`. The latest `callback`
 * is always used so the wrapper never goes stale, and a pending call is dropped on unmount.
 */
export function useDebouncedCallback<Callback extends (...args: never[]) => void>(
    callback: Callback | undefined,
    delay: number,
): (...args: Parameters<Callback>) => void {
    const callbackRef = useRef(callback);
    callbackRef.current = callback;
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => () => {
        if (timerRef.current !== null) clearTimeout(timerRef.current);
    }, []);

    // Stable identity across renders; only a new delay makes a new wrapper.
    return useCallback((...args: Parameters<Callback>) => {
        if (timerRef.current !== null) clearTimeout(timerRef.current);
        timerRef.current = setTimeout(() => {
            timerRef.current = null;
            callbackRef.current?.(...args);
        }, delay);
    }, [delay]);
}
