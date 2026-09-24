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
    { name: "Fly",             neurons: 1e5,    weightKg: 1.2e-5, lifespanYears: 0.08 },
    { name: "Dog",             neurons: 2.25e9, weightKg: 30,     lifespanYears: 12   },
    { name: "African Elephant", neurons: 257e9,  weightKg: 5000,   lifespanYears: 65   },
];

function formatCount(count: number): string {
    return count.toLocaleString("en-US", { maximumFractionDigits: count < 10 ? 1 : 0 });
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

    return (
        <div className="flex flex-wrap gap-x-6 gap-y-1 text-xs text-neutral-500">
            <span className="text-neutral-400">number to equal one human:</span>
            {EXAMPLES.map(p => {
                const count = human / score(p);
                return (
                    <span key={p.name}>
                        {p.name}:{" "}
                        <span className={`font-medium ${count < 1 ? "text-red-600" : "text-neutral-700"}`}>
                            {formatCount(count)}
                        </span>
                    </span>
                );
            })}
        </div>
    );
}
