import { Cell } from '../../Table/Cell';

export function DummyCell() {
  return (
    <Cell key="dummy" align="right">
      <span className="text-neutral-300 text-xs">test</span>
    </Cell>
  );
}
