const BUTTON = 'px-3 py-1 text-sm rounded border border-neutral-200 text-neutral-600 hover:bg-neutral-50';

type Props = {
    onExport: () => void;
    onImport: (file: File | undefined) => void;
    /** Opens the diet's nutrition breakdown; the "Show Diet" button is greyed out until a food is added. */
    onShow?: () => void;
    hasFoods: boolean;
};

/** Export the diet to a file, import one back, or open its nutrition breakdown. */
export function DietActions({ onExport, onImport, onShow, hasFoods }: Props) {
    return (
        <div className="flex flex-wrap gap-2">
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
            {onShow && (
                <button onClick={onShow} disabled={!hasFoods} className={`${BUTTON} disabled:opacity-40 disabled:hover:bg-transparent disabled:cursor-not-allowed`}>
                    Show Diet
                </button>
            )}
        </div>
    );
}
