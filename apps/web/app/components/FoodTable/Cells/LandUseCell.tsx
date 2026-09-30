import { Cell } from '../../Table/Cell';
import type { LandUseDetail } from '../FoodTableTypes';
import { getLandUseColor } from '../FoodTableStyles';
import { LandUseTooltip } from '../Tooltips/LandUseTooltip';
import { EmptyValue } from './EmptyValue';

export function LandUseCell({ value, detail, divisor, unit }: { value: number | null; detail: LandUseDetail; divisor: number; unit: string }) {
  return (
    <Cell key="landUse" align="right">
      {value != null
        ? (
          <LandUseTooltip detail={detail} divisor={divisor} unit={unit}>
            <span className={getLandUseColor(value)}>{value.toFixed(1)}</span>
          </LandUseTooltip>
        )
        : <EmptyValue />
      }
    </Cell>
  );
}
