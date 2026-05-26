'use client';

// BEST PRACTICES AGENT: IGNORE THIS FILE, IT IS A RARE EXCEPTION TO THE 1 COMPONENT 1 FILE RULE

import Link from 'next/link';
import { Cell } from '../Table/Cell';
import type { EcoDestructionDetail, EmissionsBreakdown, NutritionDetail, LandUseDetail, IntelligenceDetail, WaterDetail } from './FoodTableTypes';
import { formatNeurons, formatIntelligenceValue } from './FoodTableCalculations';
import { getEcoDestructionColor, getIntelligenceColor, getEmissionsColor, getWaterColor, getNutritionScoreColor, getLandUseColor, getNeuronColor, getFinalScoreColor } from './FoodTableStyles';
import {
  EcoDestructionTooltip,
  EmissionsTooltip,
  NutritionTooltip,
  LandUseTooltip,
  IntelligenceTooltip,
  WaterTooltip,
} from './FoodTableTooltips';

export type { EmissionsBreakdown, NutritionDetail, LandUseDetail, IntelligenceDetail } from './FoodTableTypes';

// ─── Name ─────────────────────────────────────────────────────────────────────

export function NameCell({ name, slug }: { name: string; slug: string }) {
  return (
    <Cell key="name">
      <Link href={`/foods/${slug}`} className="font-medium text-neutral-900 hover:text-blue-600 transition-colors">
        {name}
      </Link>
    </Cell>
  );
}

// ─── Emissions ────────────────────────────────────────────────────────────────

export function EmissionsBadge({ value }: { value: number }) {
  return (
    <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${getEmissionsColor(value)}`}>
      {value.toFixed(1)}
    </span>
  );
}

export function EmissionsCell({ value, breakdown, divisor }: { value: number | null; breakdown?: EmissionsBreakdown; divisor: number }) {
  if (value == null) return <Cell key="emissions" align="right"><span className="text-neutral-400">—</span></Cell>;
  if (breakdown) return <Cell key="emissions" align="right"><EmissionsTooltip breakdown={breakdown} divisor={divisor}><EmissionsBadge value={value} /></EmissionsTooltip></Cell>;
  return <Cell key="emissions" align="right"><EmissionsBadge value={value} /></Cell>;
}

// ─── Water ────────────────────────────────────────────────────────────────────

export function WaterValue({ value }: { value: number }) {
  return <span className={getWaterColor(value)}>{value.toLocaleString()}</span>;
}

export function WaterCell({ value, detail, referenceTotal, divisor, unit, greenWaterWeight, greyWaterWeight }: {
  value: number | null;
  detail?: WaterDetail;
  referenceTotal?: number | null;
  divisor: number;
  unit: string;
  greenWaterWeight: number;
  greyWaterWeight: number;
}) {
  if (value == null) return <Cell key="water" align="right"><span className="text-neutral-400">—</span></Cell>;
  const hasBreakdown = detail?.green != null || detail?.blue != null;
  if (hasBreakdown) {
    return (
      <Cell key="water" align="right">
        <WaterTooltip
          detail={detail!}
          referenceTotal={referenceTotal ?? null}
          divisor={divisor}
          unit={unit}
          greenWaterWeight={greenWaterWeight}
          greyWaterWeight={greyWaterWeight}
        >
          <WaterValue value={value} />
        </WaterTooltip>
      </Cell>
    );
  }
  return <Cell key="water" align="right"><WaterValue value={value} /></Cell>;
}

// ─── Nutrition ────────────────────────────────────────────────────────────────

export function NutritionScore({ score }: { score: number }) {
  return (
    <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${getNutritionScoreColor(score)}`}>
      {score.toFixed(1)}
    </span>
  );
}

export function NutritionScoreCell({ score, detail }: { score: number | null; detail: NutritionDetail }) {
  return (
    <Cell key="nutritionScore" align="right">
      {score != null
        ? <NutritionTooltip detail={detail}><NutritionScore score={score} /></NutritionTooltip>
        : <span className="text-neutral-400">—</span>
      }
    </Cell>
  );
}

// ─── Land Use ─────────────────────────────────────────────────────────────────

export function LandUseValue({ value }: { value: number | null }) {
  if (value === null) return <span className="text-neutral-400">—</span>;
  return <span className={getLandUseColor(value)}>{value.toFixed(1)}</span>;
}

export function LandUseCell({ value, detail, divisor, unit }: { value: number | null; detail: LandUseDetail; divisor: number; unit: string }) {
  return (
    <Cell key="landUse" align="right">
      {value != null
        ? <LandUseTooltip detail={detail} divisor={divisor} unit={unit}><LandUseValue value={value} /></LandUseTooltip>
        : <LandUseValue value={null} />
      }
    </Cell>
  );
}

// ─── Intelligence ─────────────────────────────────────────────────────────────

export function IntelligenceValue({ value }: { value: number | null }) {
  if (value === null || value === 0) return <span className="text-neutral-400">—</span>;
  return <span className={getIntelligenceColor(value)}>{formatIntelligenceValue(value)}</span>;
}

export function IntelligenceCell({ value, detail }: { value: number | null; detail: IntelligenceDetail }) {
  return (
    <Cell key="intelligence" align="right">
      {value != null
        ? <IntelligenceTooltip detail={detail}><IntelligenceValue value={value} /></IntelligenceTooltip>
        : <IntelligenceValue value={null} />
      }
    </Cell>
  );
}

// ─── Eco Destruction ─────────────────────────────────────────────────────────

export function EcoDestructionValue({ value }: { value: number | null }) {
  if (value === null || value === 0) return <span className="text-neutral-400">—</span>;
  return <span className={getEcoDestructionColor(value)}>{formatIntelligenceValue(value)}</span>;
}

export function EcoDestructionCell({ value, detail, divisor = 1 }: { value: number | null; detail: EcoDestructionDetail; divisor?: number }) {
  return (
    <Cell key="ecoDestruction" align="right">
      {value != null
        ? <EcoDestructionTooltip detail={detail} divisor={divisor}><EcoDestructionValue value={value} /></EcoDestructionTooltip>
        : <EcoDestructionValue value={null} />
      }
    </Cell>
  );
}

// ─── Final Score ──────────────────────────────────────────────────────────────

export function FinalScoreCell({ score }: { score: number | null }) {
    if (score == null) return <Cell key="finalScore" align="right"><span className="text-neutral-400">—</span></Cell>;
    return (
        <Cell key="finalScore" align="right">
            <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${getFinalScoreColor(score)}`}>
                {Math.round(score)}%
            </span>
        </Cell>
    );
}

// ─── Dummy ────────────────────────────────────────────────────────────────────

export function DummyCell() {
  return (
    <Cell key="dummy" align="right">
      <span className="text-neutral-300 text-xs">test</span>
    </Cell>
  );
}

// ─── NeuronValue (kept for other uses) ───────────────────────────────────────

export function NeuronValue({ value }: { value: number }) {
  if (value === 0) return <span className="text-neutral-400">—</span>;
  return <span className={`font-medium ${getNeuronColor(value)}`}>{formatNeurons(value)}</span>;
}
