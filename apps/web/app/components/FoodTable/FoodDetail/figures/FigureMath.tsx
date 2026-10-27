import type { MathStep } from './math/FoodDetailMath';

/** The figure's working, one step per line: label, equation with this food's numbers, result. */
export function FigureMath({ steps }: { steps: MathStep[] }) {
  if (steps.length === 0) return null;

  return (
    <div className="rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2.5">
      <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-neutral-500">How it's calculated</h4>
      <ol className="space-y-2">
        {steps.map((step, index) => (
          <li key={index} className="text-xs">
            <div className="font-medium text-neutral-500">{step.label}</div>
            <div className="mt-0.5 flex flex-wrap items-baseline gap-x-2">
              <span className="break-words font-mono text-neutral-700">{step.expression}</span>
              <span className="whitespace-nowrap font-mono font-semibold text-neutral-900">= {step.result}</span>
            </div>
          </li>
        ))}

      </ol>
    </div>
  );
}
