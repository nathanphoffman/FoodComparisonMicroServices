import { Cell } from '../../Table/Cell';
import type { WaterDetail } from '../FoodTableTypes';
import { getWaterColor } from '../FoodTableStyles';
import { WaterTooltip } from '../Tooltips/WaterTooltip';
import { EmptyValue } from './EmptyValue';

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
  if (value == null) return <Cell key="water" align="right"><EmptyValue /></Cell>;
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
