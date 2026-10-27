import type { SentientHarmDetail } from '../../../types/FoodTableTypes';
import { formatIntelligenceValue } from '../../../nutrition/FoodTableCalculations';
import { getColor } from '../../FoodTableStyles';
import { SentientHarmTooltip } from '../../Tooltips/SentientHarmTooltip';
import { EmptyValue, ValueCell } from '../ValueCell';

/** Also used by CaptiveSentienceCell, which shares the same colour scale. A harm of 0 reads as no value. */
export function SentientHarmValue({ value }: { value: number | null }) {
  if (value === null || value === 0) return <EmptyValue />;

  return <span className={getColor('sentientHarm', value)}>{formatIntelligenceValue(value)}</span>;
}

export function SentientHarmCell({ value, detail, divisor = 1, killMultiplier, explanation }: { value: number | null; detail: SentientHarmDetail; divisor?: number; killMultiplier: number; explanation?: string | null }) {
  return (
    <ValueCell value={value}>
      {harm => <SentientHarmTooltip detail={detail} divisor={divisor} killMultiplier={killMultiplier} total={harm} explanation={explanation}><SentientHarmValue value={harm} /></SentientHarmTooltip>}
    </ValueCell>
  );
}
