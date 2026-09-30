import { Cell } from '../../Table/Cell';
import type { KillDetail } from '../FoodTableTypes';
import { CaptiveSentienceTooltip } from '../Tooltips/CaptiveSentienceTooltip';
import { SentientHarmValue } from './SentientHarmCell';

export function CaptiveSentienceCell({ value, killDetail, captivityMultiplier, explanation }: { value: number | null; killDetail?: KillDetail | null; captivityMultiplier: number; explanation?: string | null }) {
  return (
    <Cell key="captiveSentience" align="right">
      {value && killDetail
        ? <CaptiveSentienceTooltip killDetail={killDetail} captivityMultiplier={captivityMultiplier} explanation={explanation}><SentientHarmValue value={value} /></CaptiveSentienceTooltip>
        : <SentientHarmValue value={value} />
      }
    </Cell>
  );
}
