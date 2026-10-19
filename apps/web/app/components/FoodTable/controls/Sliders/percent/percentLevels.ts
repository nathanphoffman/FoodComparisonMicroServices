import { useState } from 'react';
import { useDebouncedCallback, DEBOUNCE_MS } from '../../../../../hooks/useDebouncedCallback';

export const MAX_LEVEL = 10;
export const DEFAULT_LEVEL = MAX_LEVEL / 2;

export type Levels<K extends string> = Record<K, number>;

/** Every key at the same level — i.e. equal shares. */
export function equalLevels<K extends string>(keys: K[]): Levels<K> {
    return Object.fromEntries(keys.map(key => [key, DEFAULT_LEVEL])) as Levels<K>;
}

/**
 * Turns independent "how much do I care" levels into percentages that sum to 100.
 * Only the ratios matter: levels of 10 and 5 become 67% and 33%.
 * If everything is at 0 ("Don't Care"), every share is 0.
 */
export function toShares<K extends string>(levels: Levels<K>): Levels<K> {
    const keys = Object.keys(levels) as K[];
    const total = keys.reduce((runningTotal, key) => runningTotal + levels[key], 0);
    return Object.fromEntries(
        keys.map(key => [key, total > 0 ? (levels[key] / total) * 100 : 0])
    ) as Levels<K>;
}

/**
 * The slider levels and the shares they make. The display updates at once; `onChange` (which rescores everything)
 * is debounced.
 */
export function usePercentLevels<K extends string>(keys: K[], defaultLevels: Levels<K> | undefined, onChange?: (shares: Levels<K>) => void) {
    const [levels, setLevels] = useState<Levels<K>>(() => defaultLevels ?? equalLevels(keys));
    const debouncedOnChange = useDebouncedCallback(onChange, DEBOUNCE_MS);

    function apply(next: Levels<K>) {
        setLevels(next);
        debouncedOnChange(toShares(next));
    }

    return {
        levels,
        shares: toShares(levels),
        setLevel: (key: K, level: number) => apply({ ...levels, [key]: level }),
        balance: () => apply(equalLevels(keys)),
    };
}
