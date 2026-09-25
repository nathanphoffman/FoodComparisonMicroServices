'use client';

import { useState, useEffect } from "react";
import { useIsMobile } from "../../../hooks/useIsMobile";

export function ExpandableSliderGroup({
    label,
    children,
    defaultOpen = true,
}: {
    label: string;
    children: React.ReactNode;
    defaultOpen?: boolean;
}) {
    const [open, setOpen] = useState(defaultOpen);
    const isMobile = useIsMobile();

    // Start collapsed on mobile so the table isn't buried under controls.
    useEffect(() => {
        if (isMobile) setOpen(false);
    }, [isMobile]);

    return (
        <div className="flex flex-col gap-3 border border-neutral-100 rounded-lg p-3">
            <button
                type="button"
                onClick={() => setOpen(prev => !prev)}
                className="flex items-center justify-between w-full text-left group"
            >
                <span className="text-xs font-medium text-neutral-500 uppercase tracking-wide group-hover:text-neutral-700 transition-colors">
                    {label}
                </span>
                <svg
                    className={`w-3.5 h-3.5 text-neutral-400 group-hover:text-neutral-600 transition-transform duration-200 ${open ? "rotate-0" : "-rotate-90"}`}
                    viewBox="0 0 16 16"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    aria-hidden="true"
                >
                    <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
            </button>
            {open && (
                <div className="flex flex-col md:flex-row gap-4 md:gap-6">
                    {children}
                </div>
            )}
        </div>
    );
}
