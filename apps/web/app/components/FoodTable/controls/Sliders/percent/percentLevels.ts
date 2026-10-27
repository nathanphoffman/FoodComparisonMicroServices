import { useState } from 'react';
import { useDebouncedCallback, DEBOUNCE_MS } from '../../../../../hooks/useDebouncedCallback';
import { sumOf } from '@/lib/sumOf';

export const MAX_LEVEL = 10;
export const DEFAULT_LEVEL = MAX_LEVEL / 2;

export type Levels<LevelKey extends string> = Record<LevelKey, number>;

/** Every key at the same level — i.e. equal shares. */
export function equalLevels<LevelKey extends string>(keys: LevelKey[]): Levels<LevelKey> {
    return Object.fromEntries(keys.map(key => [key, DEFAULT_LEVEL])) as Levels<LevelKey>;
}

/**
 * Turns independent "how much do I care" levels into percentages that sum to 100.
 * Only the ratios matter: levels of 10 and 5 become 67% and 33%.
 * If everything is at 0 ("Don't Care"), every share is 0.
 */
export function toShares<LevelKey extends string>(levels: Levels<LevelKey>): Levels<LevelKey> {
    const keys = Object.keys(levels) as LevelKey[];
    const total = sumOf(keys.map(key => levels[key]));

    return Object.fromEntries(
        keys.map(key => [key, total > 0 ? (levels[key] / total) * 100 : 0])
    ) as Levels<LevelKey>;
}

/**
 * The slider levels and the shares they make. The display updates at once; `onChange` (which rescores everything)
 * is debounced.
 */
export function usePercentLevels<LevelKey extends string>(keys: LevelKey[], defaultLevels: Levels<LevelKey> | undefined, onChange?: (shares: Levels<LevelKey>) => void) {
    const [levels, setLevels] = useState<Levels<LevelKey>>(() => defaultLevels ?? equalLevels(keys));
    const debouncedOnChange = useDebouncedCallback(onChange, DEBOUNCE_MS);

    function apply(next: Levels<LevelKey>) {
        setLevels(next);
        debouncedOnChange(toShares(next));
    }

    return {
        levels,
        shares: toShares(levels),
        setLevel: (key: LevelKey, level: number) => apply({ ...levels, [key]: level }),
        balance: () => apply(equalLevels(keys)),
    };
}
