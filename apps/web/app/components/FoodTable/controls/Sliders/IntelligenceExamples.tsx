'use client';

// Mirrors compute_intelligence in services/wasm-calculations/src/calculations/eco/intelligence.rs.
// Keep the two in sync.
function computeIntelligence(
    neurons: number,
    weightKg: number,
    lifespanYears: number,
    neuronExp: number,
    weightExp: number,
    finalExp: number,
): number {
    const raw = Math.pow(neurons, neuronExp) * lifespanYears / Math.pow(weightKg, weightExp);
    return Math.pow(raw, finalExp);
}

type Profile = { name: string; neurons: number; weightKg: number; lifespanYears: number };

const HUMAN: Profile = { name: "Human", neurons: 86e9, weightKg: 70, lifespanYears: 80 };

const EXAMPLES: Profile[] = [
    { name: "Oyster",           neurons: 1e4,     weightKg: 0.015,  lifespanYears: 20   },
    { name: "Fly",              neurons: 1e5,     weightKg: 1.2e-5, lifespanYears: 0.08 },
    { name: "Mouse",            neurons: 71e6,    weightKg: 0.025,  lifespanYears: 2    },
    { name: "Cat",              neurons: 760e6,   weightKg: 4.5,    lifespanYears: 15   },
    { name: "Dog",              neurons: 2.25e9,  weightKg: 30,     lifespanYears: 12   },
    { name: "Dolphin",          neurons: 12.7e9,  weightKg: 200,    lifespanYears: 40   },
    { name: "Chimpanzee",       neurons: 28e9,    weightKg: 50,     lifespanYears: 40   },
    { name: "African Elephant", neurons: 257e9,   weightKg: 5000,   lifespanYears: 65   },
];

const HUMAN_PRISON_YEARS = 100;

const SECONDS_PER_YEAR = 365.25 * 24 * 60 * 60;
const TIME_UNITS: { name: string; seconds: number }[] = [
    { name: "year",        seconds: SECONDS_PER_YEAR },
    { name: "month",       seconds: SECONDS_PER_YEAR / 12 },
    { name: "day",         seconds: 24 * 60 * 60 },
    { name: "hour",        seconds: 60 * 60 },
    { name: "minute",      seconds: 60 },
    { name: "second",      seconds: 1 },
    { name: "millisecond", seconds: 0.001 },
];

function formatCount(count: number): string {
    return count.toLocaleString("en-US", { maximumFractionDigits: count < 10 ? 1 : 0 });
}

// Picks the largest unit that keeps the number at 1 or more.
function formatDuration(years: number): string {
    const seconds = years * SECONDS_PER_YEAR;
    const unit = TIME_UNITS.find(u => seconds >= u.seconds);
    if (!unit) return "<1 millisecond";
    const amount = seconds / unit.seconds;
    const rounded = Number(amount.toFixed(amount < 10 ? 1 : 0));
    return `${formatCount(amount)} ${unit.name}${rounded === 1 ? "" : "s"}`;
}

export function IntelligenceExamples({
    neuronExponent,
    weightExponent,
    finalIntelligenceExponent,
}: {
    neuronExponent: number;
    weightExponent: number;
    finalIntelligenceExponent: number;
}) {
    const score = (p: Profile) => computeIntelligence(
        p.neurons, p.weightKg, p.lifespanYears, neuronExponent, weightExponent, finalIntelligenceExponent,
    );
    const human = score(HUMAN);
    // Sorted lowest to highest prison time (i.e. highest count first).
    const examples = EXAMPLES
        .map(p => ({ name: p.name, count: human / score(p) }))
        .sort((a, b) => b.count - a.count);

    return (
        <div className="flex flex-wrap gap-x-6 gap-y-1 text-xs text-neutral-500">
            <span className="text-neutral-400">kill prison time ({HUMAN_PRISON_YEARS} years per human base):</span>
            {examples.map(({ name, count }) => (
                <span key={name}>
                    {name}:{" "}
                    <span className={`font-medium ${count < 1 ? "text-red-600" : "text-neutral-700"}`}>
                        {formatDuration(HUMAN_PRISON_YEARS / count)}
                    </span>
                </span>
            ))}
        </div>
    );
}
