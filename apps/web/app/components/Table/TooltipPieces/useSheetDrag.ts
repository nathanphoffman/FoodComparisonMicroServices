import { useRef, useState } from 'react';

const SHEET_MAX_SHARE_OF_SCREEN = 0.9;

// Dragging the sheet shorter than this closes it.
const SHEET_CLOSE_BELOW_PX = 100;

/** Makes the sheet's handle drag it taller or shorter; dragging it far down calls `onClose`. */
export function useSheetDrag(onClose: () => void) {
  const sheetRef = useRef<HTMLDivElement>(null);
  const drag = useRef<{ startY: number; startHeight: number } | null>(null);

  // null until the handle is first dragged; until then the sheet is as tall as its content.
  const [height, setHeight] = useState<number | null>(null);

  function heightAt(event: React.PointerEvent) {
    const { startY, startHeight } = drag.current!;

    return Math.min(startHeight + startY - event.clientY, window.innerHeight * SHEET_MAX_SHARE_OF_SCREEN);
  }

  const handleProps = {
    onPointerDown: (event: React.PointerEvent<HTMLElement>) => {
      event.currentTarget.setPointerCapture(event.pointerId);
      drag.current = { startY: event.clientY, startHeight: sheetRef.current!.offsetHeight };
    },
    onPointerMove: (event: React.PointerEvent) => { if (drag.current) setHeight(Math.max(heightAt(event), 0)); },
    onPointerUp: (event: React.PointerEvent) => {
      if (!drag.current) return;
      const finalHeight = heightAt(event);
      drag.current = null;

      if (finalHeight < SHEET_CLOSE_BELOW_PX) onClose();
    },
    onPointerCancel: () => { drag.current = null; },
  };

  return { sheetRef, height, handleProps };
}
