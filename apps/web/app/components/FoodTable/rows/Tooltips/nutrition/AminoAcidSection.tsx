import type { NutritionDetail } from '../../../types/FoodTableTypes';
import { aminoAcidProfile } from '../../../nutrition/FoodTableCalculations';
import { TooltipSection, TooltipRow } from '../../../../Table/Tooltip';
import { needColor } from './nutritionColors';

const formatMilligrams = (mg: number) => `${mg.toLocaleString(undefined, { maximumFractionDigits: 1 })} mg`;
const formatPercent = (share: number) => `${(share * 100).toFixed(0)}%`;

/** Each essential amino acid per gram of protein against what the body needs, and the weakest one that sets the score. */
export function AminoAcidSection({ detail }: { detail: NutritionDetail }) {
  const profile = aminoAcidProfile(detail);
  if (!profile) return null;
  const { score, limiting, requirements, others } = profile;

  return (
    <TooltipSection title="Amino acids (mg per g of protein, % of need)">
      {score != null && (
        <TooltipRow label={<span className="font-medium">Amino acid score</span>} value={
          <>
            <span className={`font-medium ${needColor(score * 100)}`}>{formatPercent(score)}</span>
            {limiting && score < 1 && <span className="ml-2 text-amber-300">limited by {limiting.toLowerCase()}</span>}
          </>
        } />
      )}
      {requirements.map(({ label, mgPerGramProtein, share }) => (
        <TooltipRow key={label} label={label} value={
          <>
            {formatMilligrams(mgPerGramProtein)}
            <span className={`ml-2 inline-block w-12 text-right ${needColor(share * 100)}`}>{formatPercent(share)}</span>
          </>
        } />
      ))}
      {others.length > 0 && <div className="mt-1 text-xs text-neutral-400">Other amino acids</div>}
      {others.map(({ label, mgPerGramProtein }) => <TooltipRow key={label} label={label} value={formatMilligrams(mgPerGramProtein)} />)}
    </TooltipSection>
  );
}
