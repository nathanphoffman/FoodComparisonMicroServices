type Props = {
  bubbleRef: React.RefObject<HTMLDivElement | null>;
  /** How far the bubble is slid sideways to stay inside the window. */
  shift: number;
  /** Stays showing after a tap instead of only while hovered. */
  pinned: boolean;
  children: React.ReactNode;
};

/** The dark bubble that appears above the hovered text on wider screens, with an arrow pointing at it. */
export function TooltipBubble({ bubbleRef, shift, pinned, children }: Props) {
  return (
    <div
      ref={bubbleRef}
      style={{ '--shift': `${shift}px` } as React.CSSProperties}
      className={`pointer-events-none z-20 hidden md:group-hover/tip:block ${pinned ? 'md:block' : ''} md:absolute md:bottom-full md:left-[calc(50%+var(--shift,0px))] md:-translate-x-1/2 md:mb-2 md:w-max md:max-w-[calc(100vw-1rem)]`}
    >
      <div className="bg-neutral-900 text-neutral-100 text-xs text-left rounded-lg px-3 py-2.5 shadow-xl">
        {children}
      </div>
      <div className="absolute top-full left-[calc(50%-var(--shift,0px))] -translate-x-1/2 w-0 h-0 border-x-4 border-x-transparent border-t-4 border-t-neutral-900" />
    </div>
  );
}
