'use client';

import { useEffect } from "react";

export function Modal({ title, onClose, children }: {
    title: string;
    onClose: () => void;
    children: React.ReactNode;
}) {
    useEffect(() => {
        const handleKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
        document.addEventListener('keydown', handleKey);
        return () => document.removeEventListener('keydown', handleKey);
    }, [onClose]);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/40" onClick={onClose} />
            <div className="relative bg-white rounded-xl shadow-xl max-w-md w-full mx-4 p-6">
                <div className="flex items-start justify-between mb-4">
                    <h2 className="text-sm font-semibold text-neutral-800">{title}</h2>
                    <button
                        onClick={onClose}
                        className="ml-4 text-neutral-400 hover:text-neutral-600 transition-colors"
                        aria-label="Close"
                    >
                        <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                        </svg>
                    </button>
                </div>
                <div className="text-xs text-neutral-600 space-y-2 leading-relaxed">
                    {children}
                </div>
            </div>
        </div>
    );
}
