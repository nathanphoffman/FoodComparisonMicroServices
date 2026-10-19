import type { LandUseDetail } from '../../../types/FoodTableTypes';
import { getLandUseColor } from '../../FoodTableStyles';
import { LandUseTooltip } from '../../Tooltips/LandUseTooltip';
import { ValueCell } from '../ValueCell';

export function LandUseCell({ value, detail, divisor, unit }: { value: number | null; detail: LandUseDetail; divisor: number; unit: string }) {
  return (
    <ValueCell value={value}>
      {landUse => (
        <LandUseTooltip detail={detail} divisor={divisor} unit={unit}>
          <span className={getLandUseColor(landUse)}>{landUse.toFixed(1)}</span>
        </LandUseTooltip>
      )}
    </ValueCell>
  );
}
