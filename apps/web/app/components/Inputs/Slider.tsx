export function Slider({ min = 0, max = 100, value, onChange }: { min?: number; max?: number; value: number; onChange: (value: number) => void }) {

    const pct = ((value - min) / (max - min)) * 100;

    const setSlider = (e: React.ChangeEvent<HTMLInputElement>) => {
        onChange(Number(e.target.value));
    };

    return <input className="w-full appearance-none cursor-pointer focus:outline-none"
          style={{
            background: `linear-gradient(to right, #3b82f6 ${pct}%, #e5e7eb ${pct}%)`
          }}
 type="range" min={min} max={max} value={value} onChange={setSlider}></input>
}