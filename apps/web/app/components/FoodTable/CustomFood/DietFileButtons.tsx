const BUTTON = 'px-3 py-1 text-sm rounded border border-neutral-200 text-neutral-600 hover:bg-neutral-50';

/** Export the diet to a file, or import one back. */
export function DietFileButtons({ onExport, onImport }: { onExport: () => void; onImport: (file: File | undefined) => void }) {
    return (
        <div className="flex gap-2">
            <button onClick={onExport} className={BUTTON}>Export Diet</button>
            <label className={`${BUTTON} cursor-pointer`}>
                Import Diet
                <input
                    type="file"
                    accept="application/json,.json"
                    className="hidden"
                    onChange={e => { onImport(e.target.files?.[0]); e.target.value = ''; }}
                />
            </label>
        </div>
    );
}
