type Option<Value extends string> = { value: Value; label: string };

type Props<Value extends string> = {
    label: string;
    value: Value;
    options: Option<Value>[];
    onChange: (value: Value) => void;
    /** Text colour of the label; the toolbar uses a quieter one than the forms. */
    labelClassName?: string;
    /** Extra classes for the dropdown itself, such as a maximum width. */
    selectClassName?: string;
    title?: string;
};

/** A label with a dropdown beside it. */
export function SelectField<Value extends string>({ label, value, options, onChange, labelClassName = 'text-neutral-700', selectClassName = '', title }: Props<Value>) {
    return (
        <label className={`flex items-center gap-2 text-sm ${labelClassName}`} title={title}>
            {label}
            <select
                value={value}
                onChange={event => onChange(event.target.value as Value)}
                className={`border border-neutral-200 rounded px-2 py-1 text-sm text-neutral-700 bg-white ${selectClassName}`}
            >
                {options.map(option => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                ))}
            </select>
        </label>
    );
}
