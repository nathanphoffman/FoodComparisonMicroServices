import { useRef, useCallback, useEffect } from "react";

export const DEBOUNCE_MS = 500;

/**
 * Returns a stable debounced wrapper around `callback`. The latest `callback`
 * is always used so the wrapper never goes stale, and a pending call is dropped on unmount.
 */
export function useDebouncedCallback<T extends (...args: never[]) => void>(
    callback: T | undefined,
    delay: number,
): (...args: Parameters<T>) => void {
    const callbackRef = useRef(callback);
    callbackRef.current = callback;
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => () => {
        if (timerRef.current !== null) clearTimeout(timerRef.current);
    }, []);

    // Stable identity across renders; only a new delay makes a new wrapper.
    return useCallback((...args: Parameters<T>) => {
        if (timerRef.current !== null) clearTimeout(timerRef.current);
        timerRef.current = setTimeout(() => {
            timerRef.current = null;
            callbackRef.current?.(...args);
        }, delay);
    }, [delay]);
}
