'use client';

import { useCallback, useRef, useState } from 'react';
import { useOutsidePointerDown } from '../../hooks/useOutsidePointerDown';
import { TooltipBubble } from './TooltipPieces/TooltipBubble';
import { TooltipSheet } from './TooltipPieces/TooltipSheet';
import { useBubbleShift } from './TooltipPieces/useBubbleShift';

export { TooltipSection, TooltipRow } from './TooltipPieces/TooltipLayout';

// Same breakpoint as Tailwind's `md:`, which switches the tooltip from a sheet to a bubble.
const WIDE_SCREEN_QUERY = '(min-width: 768px)';

// Opens on hover (desktop) or tap (touch). On phones it opens as a scrolling bottom sheet instead.
export function Tooltip({ children, content }: { children: React.ReactNode, content: React.ReactNode }) {
  const [open, setOpen] = useState(false);

  // Phones get the sheet and everything else the hover bubble, so the content is only drawn once.
  const [asSheet, setAsSheet] = useState(false);
  const wrapperRef = useRef<HTMLSpanElement>(null);
  const { bubbleRef, shift, fitToWindow } = useBubbleShift();
  const close = useCallback(() => setOpen(false), []);
  useOutsidePointerDown(wrapperRef, open, close);

  function toggle() {
    if (open) return close();
    setAsSheet(!window.matchMedia(WIDE_SCREEN_QUERY).matches);
    setOpen(true);
  }

  return (
    <span ref={wrapperRef} onMouseEnter={fitToWindow} className="relative group/tip inline-block">
      <span onClick={toggle} className="underline decoration-dashed decoration-neutral-400 underline-offset-2 cursor-help">
        {children}
      </span>
      <TooltipBubble bubbleRef={bubbleRef} shift={shift} pinned={open && !asSheet}>
        {!(open && asSheet) && content}
      </TooltipBubble>
      {open && asSheet && <TooltipSheet onClose={close}>{content}</TooltipSheet>}
    </span>
  );
}
