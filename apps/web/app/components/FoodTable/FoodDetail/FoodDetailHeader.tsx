/** The window's title bar: the food's name, a hint, and the close button. */
export function FoodDetailHeader({ name, titleId, onClose }: { name: string; titleId: string; onClose: () => void }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-neutral-100 px-5 py-4">
      <div>
        <h2 id={titleId} className="text-base font-semibold text-neutral-900">{name}</h2>
        <p className="mt-0.5 text-xs text-neutral-500">Click a figure for sourcing</p>
      </div>
      <button
        onClick={onClose}
        className="-mr-1 rounded p-1 text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-neutral-600"
        aria-label="Close"
      >
        <svg className="h-5 w-5" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </button>
    </div>
  );
}
