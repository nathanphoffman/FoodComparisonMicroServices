import { Cell } from '../../Table/Cell';
import type { IntelligenceDetail, KillDetail } from '../FoodTableTypes';
import { formatIntelligenceValue } from '../FoodTableCalculations';
import { getIntelligenceColor } from '../FoodTableStyles';
import { IntelligenceTooltip } from '../Tooltips/IntelligenceTooltip';
import { EmptyValue } from './EmptyValue';

function IntelligenceValue({ value }: { value: number | null }) {
  if (value === null || value === 0) return <EmptyValue />;
  return <span className={getIntelligenceColor(value)}>{formatIntelligenceValue(value)}</span>;
}

export function IntelligenceCell({ value, detail, killDetail, wildFishDeathsPerKg, explanation }: { value: number | null; detail: IntelligenceDetail; killDetail?: KillDetail | null; wildFishDeathsPerKg?: number | null; explanation?: string | null }) {
  return (
    <Cell key="intelligence" align="right">
      {value != null
        ? <IntelligenceTooltip detail={detail} killDetail={killDetail} wildFishDeathsPerKg={wildFishDeathsPerKg} explanation={explanation}><IntelligenceValue value={value} /></IntelligenceTooltip>
        : <IntelligenceValue value={null} />
      }
    </Cell>
  );
}
