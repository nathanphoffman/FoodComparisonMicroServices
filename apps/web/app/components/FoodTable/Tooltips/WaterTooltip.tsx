import type { WaterDetail } from '../FoodTableTypes';
import { Tooltip, TooltipSection, TooltipRow } from '../../Table/Tooltip';
import { formatPerUnit, TooltipFootnote } from './TooltipParts';

export function WaterTooltip({ detail, referenceTotal, divisor, unit, greenWaterWeight, greyWaterWeight, children }: {
  detail: WaterDetail;
  referenceTotal: number | null;
  divisor: number;
  unit: string;
  greenWaterWeight: number;
  greyWaterWeight: number;
  children: React.ReactNode;
}) {
  const weightedGreen = detail.green != null ? (greenWaterWeight / 100) * detail.green : null;
  const weightedGrey  = detail.grey  != null ? (greyWaterWeight  / 100) * detail.grey  : null;

  return (
    <Tooltip content={
      <TooltipSection title="Water breakdown">
        {detail.blue  != null && <TooltipRow label="Blue (irrigation)"  value={`${formatPerUnit(detail.blue, divisor)} L/${unit}`} />}
        {weightedGreen != null && <TooltipRow label="Green (rain)"      value={`${formatPerUnit(weightedGreen, divisor)} L/${unit}`} />}
        {weightedGrey  != null && <TooltipRow label="Grey (pollution)"  value={`${formatPerUnit(weightedGrey, divisor)} L/${unit}`} />}
        {referenceTotal != null && (
          <TooltipFootnote>Reference total (independent source): {referenceTotal.toLocaleString()} L/kg</TooltipFootnote>
        )}
      </TooltipSection>
    }>
      {children}
    </Tooltip>
  );
}
