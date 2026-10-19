import { useEffect, type RefObject } from 'react';

/** Calls `onOutside` when the pointer goes down anywhere outside `ref`'s element, while `active` is true. */
export function useOutsidePointerDown(ref: RefObject<HTMLElement | null>, active: boolean, onOutside: () => void) {
    useEffect(() => {
        if (!active) return;
        function onPointerDown(event: PointerEvent) {
            if (ref.current && !ref.current.contains(event.target as Node)) onOutside();
        }
        document.addEventListener('pointerdown', onPointerDown);
        return () => document.removeEventListener('pointerdown', onPointerDown);
    }, [ref, active, onOutside]);
}
