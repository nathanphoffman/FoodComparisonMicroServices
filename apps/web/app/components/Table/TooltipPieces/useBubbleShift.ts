import { useRef, useState } from 'react';

// Space kept between the bubble and the edge of the window.
const WINDOW_MARGIN_PX = 8;

/** Slides the hover bubble sideways (`shift`) so it stays inside the window. Call `fitToWindow` when the pointer enters. */
export function useBubbleShift() {
  const bubbleRef = useRef<HTMLDivElement>(null);
  const [shift, setShift] = useState(0);

  // The bubble is hidden until hover, so show it for a moment to measure it.
  function fitToWindow() {
    const bubble = bubbleRef.current;
    if (!bubble) return;
    const previousDisplay = bubble.style.display;
    bubble.style.display = 'block';
    const rect = bubble.getBoundingClientRect();
    bubble.style.display = previousDisplay;
    const overLeft = WINDOW_MARGIN_PX - rect.left;
    const overRight = rect.right - (window.innerWidth - WINDOW_MARGIN_PX);
    setShift(overLeft > 0 ? shift + overLeft : overRight > 0 ? shift - overRight : shift);
  }

  return { bubbleRef, shift, fitToWindow };
}
