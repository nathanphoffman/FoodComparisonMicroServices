'use client';

import { useState, useRef, useEffect } from 'react';

export function TooltipSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <div className="font-semibold text-neutral-300 mb-1.5">{title}</div>
      {children}
    </div>
  );
}

export function TooltipRow({ label, value }: { label: React.ReactNode; value: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-6">
      <span className="text-neutral-400">{label}</span>
      <span>{value}</span>
    </div>
  );
}


// Opens on hover (desktop) or tap (touch). On mobile it opens as a bottom sheet that scrolls, and the
// handle at its top drags it taller or shorter (drag it far down to close).
const SHEET_MAX_VH = 0.9;
const SHEET_CLOSE_PX = 100;
export function Tooltip({ children, content }: { children: React.ReactNode, content: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);
  const bubbleRef = useRef<HTMLDivElement>(null);
  const sheetRef = useRef<HTMLDivElement>(null);
  const drag = useRef<{ startY: number; startHeight: number } | null>(null);
  // null until the handle is first dragged; until then the sheet is as tall as its content, up to 90% of the screen.
  const [sheetHeight, setSheetHeight] = useState<number | null>(null);
  // Phones get the sheet and everything else the hover bubble, so the content is only drawn once.
  const [sheet, setSheet] = useState(false);
  // How far the bubble is slid sideways to stay inside the window.
  const [shift, setShift] = useState(0);

  function close() {
    setOpen(false);
    setSheetHeight(null);
  }

  function toggle() {
    if (open) return close();
    setSheet(!window.matchMedia('(min-width: 768px)').matches);
    setOpen(true);
  }

  function dragHeight(e: React.PointerEvent) {
    return Math.min(drag.current!.startHeight + drag.current!.startY - e.clientY, window.innerHeight * SHEET_MAX_VH);
  }

  // Slides the bubble sideways so it stays inside the window. It's hidden until hover, so
  // show it for a moment to measure it.
  function fitToWindow() {
    const bubble = bubbleRef.current;
    if (!bubble) return;
    const margin = 8;
    const previousDisplay = bubble.style.display;
    bubble.style.display = 'block';
    const rect = bubble.getBoundingClientRect();
    bubble.style.display = previousDisplay;
    const overLeft = margin - rect.left;
    const overRight = rect.right - (window.innerWidth - margin);
    setShift(overLeft > 0 ? shift + overLeft : overRight > 0 ? shift - overRight : shift);
  }

  useEffect(() => {
    if (!open) return;
    function onPointerDownOutside(e: PointerEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) close();
    }
    document.addEventListener('pointerdown', onPointerDownOutside);
    return () => document.removeEventListener('pointerdown', onPointerDownOutside);
  }, [open]);

  return (
    <span ref={ref} onMouseEnter={fitToWindow} className="relative group/tip inline-block">
      <span onClick={toggle} className="underline decoration-dashed decoration-neutral-400 underline-offset-2 cursor-help">
        {children}
      </span>
      <div ref={bubbleRef} style={{ '--shift': `${shift}px` } as React.CSSProperties} className={`pointer-events-none z-20 hidden md:group-hover/tip:block ${open && !sheet ? 'md:block' : ''} md:absolute md:bottom-full md:left-[calc(50%+var(--shift,0px))] md:-translate-x-1/2 md:mb-2 md:w-max md:max-w-[calc(100vw-1rem)]`}>
        <div className="bg-neutral-900 text-neutral-100 text-xs text-left rounded-lg px-3 py-2.5 shadow-xl">
          {!(open && sheet) && content}
        </div>
        <div className="absolute top-full left-[calc(50%-var(--shift,0px))] -translate-x-1/2 w-0 h-0 border-x-4 border-x-transparent border-t-4 border-t-neutral-900" />
      </div>
      {open && sheet && (
        <div className="md:hidden fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/40" onClick={close} />
          <div
            ref={sheetRef}
            style={sheetHeight != null ? { height: sheetHeight } : undefined}
            className="absolute inset-x-0 bottom-0 max-h-[90vh] flex flex-col bg-neutral-900 text-neutral-100 text-xs text-left rounded-t-xl shadow-xl"
          >
            <div
              className="shrink-0 flex justify-center py-3 cursor-grab touch-none"
              onPointerDown={e => {
                e.currentTarget.setPointerCapture(e.pointerId);
                drag.current = { startY: e.clientY, startHeight: sheetRef.current!.offsetHeight };
              }}
              onPointerMove={e => { if (drag.current) setSheetHeight(Math.max(dragHeight(e), 0)); }}
              onPointerUp={e => {
                if (!drag.current) return;
                const height = dragHeight(e);
                drag.current = null;
                if (height < SHEET_CLOSE_PX) close();
              }}
              onPointerCancel={() => { drag.current = null; }}
            >
              <div className="w-10 h-1 rounded-full bg-neutral-500" />
            </div>
            <div className="min-h-0 overflow-y-auto overscroll-contain px-3 pb-4">
              {content}
            </div>
          </div>
        </div>
      )}
    </span>
  );
}
