'use client';

import { useCallback, useRef, useState } from 'react';
import { useOutsidePointerDown } from '../../../../hooks/useOutsidePointerDown';
import type { SortKey } from '../../scoring/FoodTableSort';
import { COLUMN_CONFIG } from '../../scoring/FoodTableDefaults';

/** The "Columns" button and the checklist of columns it opens. */
export function ColumnPicker({ visible, onToggle }: { visible: Set<SortKey>; onToggle: (key: SortKey) => void }) {
    const [open, setOpen] = useState(false);
    const pickerRef = useRef<HTMLDivElement>(null);
    const close = useCallback(() => setOpen(false), []);
    useOutsidePointerDown(pickerRef, open, close);

    return (
        <div className="relative" ref={pickerRef}>
            <button
                onClick={() => setOpen(isOpen => !isOpen)}
                className="text-sm text-neutral-500 hover:text-neutral-700 border border-neutral-200 rounded px-3 py-1 flex items-center gap-1"
            >
                Columns <span className="text-xs">{open ? '▴' : '▾'}</span>
            </button>
            {open && (
                <div className="absolute right-0 top-full mt-1 bg-white border border-neutral-200 rounded shadow-md p-3 space-y-2 z-10 min-w-[160px]">
                    {COLUMN_CONFIG.filter(column => column.key !== 'name').map(column => (
                        <label key={column.key} className="flex items-center gap-2 text-sm cursor-pointer text-neutral-700">
                            <input
                                type="checkbox"
                                checked={visible.has(column.key)}
                                onChange={() => onToggle(column.key)}
                                className="accent-neutral-700"
                            />
                            {column.label}
                        </label>
                    ))}

                </div>
            )}

        </div>
    );
}
