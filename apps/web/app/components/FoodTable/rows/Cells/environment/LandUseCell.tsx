import type { LandUseDetail } from '../../../types/FoodTableTypes';
import { getColor } from '../../FoodTableStyles';
import { LandUseTooltip } from '../../Tooltips/LandUseTooltip';
import { ValueCell } from '../ValueCell';

export function LandUseCell({ value, detail, divisor, unit }: { value: number | null; detail: LandUseDetail; divisor: number; unit: string }) {
  return (
    <ValueCell value={value}>
      {landUse => (
        <LandUseTooltip detail={detail} divisor={divisor} unit={unit}>
          <span className={getColor('landUse', landUse)}>{landUse.toFixed(1)}</span>
        </LandUseTooltip>
      )}

    </ValueCell>
  );
}
