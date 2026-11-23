import { UI } from '@/content/ui';

export function NameTag() {

  const sameName = (UI.common.yul as string) === (UI.common.yulHangul as string);
  return (
    <div className="dg-nametag" aria-hidden="true">
      <span className="dg-nametag__brush">{UI.common.yulHangul}</span>
      {sameName ? null : <span className="dg-nametag__latin">{UI.common.yul}</span>}
      <span className="dg-nametag__seal">{UI.common.yulHanja}</span>
    </div>
  );
}
