import { useState, useEffect } from 'react';
import type { SortKey } from '../scoring/FoodTableSort';
import type { ColConfig } from '../types/FoodTableTypes';
import { COLUMN_CONFIG } from '../scoring/FoodTableDefaults';
import { useIsMobile } from '../../../hooks/useIsMobile';

/** Which columns are showing, and a toggle for one. `onActiveColsChange` hears about every change, in table order. */
export function useColumnVisibility(onActiveColsChange: (cols: ColConfig[]) => void) {
    const [visibleColumns, setVisibleColumns] = useState<Set<SortKey>>(
        () => new Set(COLUMN_CONFIG.filter(c => c.defaultVisible).map(c => c.key))
    );
    const isMobile = useIsMobile();

    // On mobile, start with a short column list; users can add more via Columns.
    useEffect(() => {
        if (!isMobile) return;
        const mobileCols = COLUMN_CONFIG.filter(c => c.mobileVisible);
        setVisibleColumns(new Set(mobileCols.map(c => c.key)));
        onActiveColsChange(mobileCols);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isMobile]);

    function toggleColumn(key: SortKey) {
        const next = new Set(visibleColumns);
        if (next.has(key)) next.delete(key);
        else next.add(key);
        setVisibleColumns(next);
        onActiveColsChange(COLUMN_CONFIG.filter(c => next.has(c.key)));
    }

    return { visibleColumns, toggleColumn };
}
