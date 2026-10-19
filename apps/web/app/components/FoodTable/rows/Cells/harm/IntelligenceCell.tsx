import type { IntelligenceDetail, KillDetail } from '../../../types/FoodTableTypes';
import { formatIntelligenceValue } from '../../../nutrition/FoodTableCalculations';
import { getColor } from '../../FoodTableStyles';
import { IntelligenceTooltip } from '../../Tooltips/IntelligenceTooltip';
import { EmptyValue, ValueCell } from '../ValueCell';

/** A kill score of 0 reads as no value. */
function IntelligenceValue({ value }: { value: number }) {
  if (value === 0) return <EmptyValue />;
  return <span className={getColor('intelligence', value)}>{formatIntelligenceValue(value)}</span>;
}

export function IntelligenceCell({ value, detail, killDetail, wildFishDeathsPerKg, explanation }: { value: number | null; detail: IntelligenceDetail; killDetail?: KillDetail | null; wildFishDeathsPerKg?: number | null; explanation?: string | null }) {
  return (
    <ValueCell value={value}>
      {kill => <IntelligenceTooltip detail={detail} killDetail={killDetail} wildFishDeathsPerKg={wildFishDeathsPerKg} explanation={explanation}><IntelligenceValue value={kill} /></IntelligenceTooltip>}
    </ValueCell>
  );
}
