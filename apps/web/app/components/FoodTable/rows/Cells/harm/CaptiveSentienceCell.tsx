import type { KillDetail } from '../../../types/FoodTableTypes';
import { CaptiveSentienceTooltip } from '../../Tooltips/CaptiveSentienceTooltip';
import { ValueCell } from '../ValueCell';
import { SentientHarmValue } from './SentientHarmCell';

export function CaptiveSentienceCell({ value, killDetail, captivityMultiplier, explanation }: { value: number | null; killDetail?: KillDetail | null; captivityMultiplier: number; explanation?: string | null }) {
  return (
    <ValueCell value={value}>
      {captive => captive && killDetail
        ? <CaptiveSentienceTooltip killDetail={killDetail} captivityMultiplier={captivityMultiplier} explanation={explanation}><SentientHarmValue value={captive} /></CaptiveSentienceTooltip>
        : <SentientHarmValue value={captive} />
      }

    </ValueCell>
  );
}
