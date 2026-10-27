import type { IntelligenceDetail, KillDetail } from '../../../types/FoodTableTypes';
import { formatIntelligenceValue } from '../../../nutrition/FoodTableCalculations';
import { getColor } from '../../FoodTableStyles';
import { DirectKillTooltip } from '../../Tooltips/DirectKillTooltip';
import { EmptyValue, ValueCell } from '../ValueCell';

/** A kill score of 0 reads as no value. */
function DirectKillValue({ value }: { value: number }) {
  if (value === 0) return <EmptyValue />;

  return <span className={getColor('directKill', value)}>{formatIntelligenceValue(value)}</span>;
}

export function DirectKillCell({ value, detail, killDetail, wildFishDeathsPerKg, explanation }: { value: number | null; detail: IntelligenceDetail; killDetail?: KillDetail | null; wildFishDeathsPerKg?: number | null; explanation?: string | null }) {
  return (
    <ValueCell value={value}>
      {kill => <DirectKillTooltip detail={detail} killDetail={killDetail} wildFishDeathsPerKg={wildFishDeathsPerKg} explanation={explanation}><DirectKillValue value={kill} /></DirectKillTooltip>}
    </ValueCell>
  );
}
