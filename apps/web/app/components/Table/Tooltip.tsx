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


// Opens on hover (desktop) or tap (touch). On mobile it shows as a sheet pinned
// to the bottom of the screen so it can't clip off the edge of a narrow cell.
export function Tooltip({ children, content }: { children: React.ReactNode, content: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!open) return;
    function onPointerDownOutside(e: PointerEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('pointerdown', onPointerDownOutside);
    return () => document.removeEventListener('pointerdown', onPointerDownOutside);
  }, [open]);

  return (
    <span ref={ref} className="relative group/tip inline-block">
      <span onClick={() => setOpen(v => !v)} className="underline decoration-dashed decoration-neutral-400 underline-offset-2 cursor-help">
        {children}
      </span>
      <div className={`pointer-events-none z-20 md:group-hover/tip:block ${open ? 'block' : 'hidden'} fixed inset-x-2 bottom-2 md:absolute md:inset-x-auto md:bottom-full md:left-1/2 md:-translate-x-1/2 md:mb-2`}>
        <div className="bg-neutral-900 text-neutral-100 text-xs text-left rounded-lg px-3 py-2.5 shadow-xl md:whitespace-nowrap">
          {content}
        </div>
        <div className="hidden md:block absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-x-4 border-x-transparent border-t-4 border-t-neutral-900" />
      </div>
    </span>
  );
}
