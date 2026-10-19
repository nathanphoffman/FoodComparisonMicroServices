import type { WaterDetail } from '../../../types/FoodTableTypes';
import { getWaterColor } from '../../FoodTableStyles';
import { WaterTooltip } from '../../Tooltips/WaterTooltip';
import { ValueCell } from '../ValueCell';

function WaterValue({ value }: { value: number }) {
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
  const hasBreakdown = detail?.green != null || detail?.blue != null;
  return (
    <ValueCell value={value}>
      {water => hasBreakdown
        ? (
          <WaterTooltip
            detail={detail!}
            referenceTotal={referenceTotal ?? null}
            divisor={divisor}
            unit={unit}
            greenWaterWeight={greenWaterWeight}
            greyWaterWeight={greyWaterWeight}
          >
            <WaterValue value={water} />
          </WaterTooltip>
        )
        : <WaterValue value={water} />
      }
    </ValueCell>
  );
}
