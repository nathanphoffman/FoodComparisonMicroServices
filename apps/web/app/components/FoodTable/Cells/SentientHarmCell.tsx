import { Cell } from '../../Table/Cell';
import type { SentientHarmDetail } from '../FoodTableTypes';
import { formatIntelligenceValue } from '../FoodTableCalculations';
import { getSentientHarmColor } from '../FoodTableStyles';
import { SentientHarmTooltip } from '../Tooltips/SentientHarmTooltip';
import { EmptyValue } from './EmptyValue';

/** Also used by CaptiveSentienceCell, which shares the same colour scale. */
export function SentientHarmValue({ value }: { value: number | null }) {
  if (value === null || value === 0) return <EmptyValue />;
  return <span className={getSentientHarmColor(value)}>{formatIntelligenceValue(value)}</span>;
}

export function SentientHarmCell({ value, detail, divisor = 1, killMultiplier, explanation }: { value: number | null; detail: SentientHarmDetail; divisor?: number; killMultiplier: number; explanation?: string | null }) {
  return (
    <Cell key="sentientHarm" align="right">
      {value != null
        ? <SentientHarmTooltip detail={detail} divisor={divisor} killMultiplier={killMultiplier} total={value} explanation={explanation}><SentientHarmValue value={value} /></SentientHarmTooltip>
        : <SentientHarmValue value={null} />
      }
    </Cell>
  );
}
