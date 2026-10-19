type Props = {
    label: string;
    value: number | null;
    /** The typed text, so the caller decides what an empty or invalid box means. */
    onChange: (text: string) => void;
    /** Tailwind width class for the box, such as `w-24`. */
    widthClassName: string;
    min?: number;
    max?: number;
    step?: number;
    placeholder?: string;
    title?: string;
};

/** A label with a number box beside it. */
export function NumberField({ label, value, onChange, widthClassName, min, max, step, placeholder, title }: Props) {
    return (
        <label className="flex items-center gap-2" title={title}>
            {label}
            <input
                type="number"
                min={min}
                max={max}
                step={step}
                inputMode="numeric"
                value={value ?? ''}
                onChange={event => onChange(event.target.value)}
                placeholder={placeholder}
                className={`border border-neutral-200 rounded px-2 py-1 text-sm text-neutral-700 bg-white ${widthClassName}`}
            />
        </label>
    );
}
