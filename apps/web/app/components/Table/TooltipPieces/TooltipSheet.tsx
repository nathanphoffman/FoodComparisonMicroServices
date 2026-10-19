import { useSheetDrag } from './useSheetDrag';

/** On phones, the tooltip opens as a bottom sheet that scrolls; its handle drags it taller or shorter. */
export function TooltipSheet({ onClose, children }: { onClose: () => void; children: React.ReactNode }) {
  const { sheetRef, height, handleProps } = useSheetDrag(onClose);
  return (
    <div className="md:hidden fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div
        ref={sheetRef}
        style={height != null ? { height } : undefined}
        className="absolute inset-x-0 bottom-0 max-h-[90vh] flex flex-col bg-neutral-900 text-neutral-100 text-xs text-left rounded-t-xl shadow-xl"
      >
        <div className="shrink-0 flex justify-center py-3 cursor-grab touch-none" {...handleProps}>
          <div className="w-10 h-1 rounded-full bg-neutral-500" />
        </div>
        <div className="min-h-0 overflow-y-auto overscroll-contain px-3 pb-4">
          {children}
        </div>
      </div>
    </div>
  );
}
