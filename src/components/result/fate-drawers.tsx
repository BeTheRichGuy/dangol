'use client';

import { FATE as F } from '@/content/fate-map';
import type { FateMap } from '@/lib/reading/fate-map';
import type { Chart, TypeKey } from '@/lib/saju';
import { LockIcon } from '../icons';
import { Narration } from '../webtoon';
import { flowLines, partnerLines, yearsLines } from './fate-lines';
import { FlowChart, FreeYearList, PartnerCard } from './fate-visuals';
import { YulTalk } from './yul-talk';
import './result.css';

export const YEARS_OPEN = 2;

export function FateDrawers({ fate, name, thisYear, chart, type }: { fate: FateMap; name: string; thisYear: number; chart: Chart; type: TypeKey }) {
  const hiddenYears = Math.max(0, fate.years.length - YEARS_OPEN);
  return (
    <section aria-label={F.drawers.lead} className="grid gap-4">
      <Narration voice="stage">
        <p>{F.drawers.lead}</p>
      </Narration>

      {fate.years.length > 0 ? (
        <div className="mt-4">
          <YulTalk lines={yearsLines(fate.years, thisYear, YEARS_OPEN, name, fate.months)} type={type} glyph="年" label={F.talk.years.lead(name)} />
        </div>
      ) : null}
      {fate.years.length > 0 ? (
        <Narration serif className="rs-fate rs-fate--years">
          <h3 className="rs-fate__head">{F.drawers.years.head(name)}</h3>
          <p className="rs-fate__sub">{F.drawers.years.sub}</p>
          <FreeYearList years={fate.years} thisYear={thisYear} months={fate.months ?? []} open={YEARS_OPEN} />
          {hiddenYears > 0 ? (
            <p className="rs-fate__more">
              <LockIcon size={16} /> <span>{F.drawers.years.more(hiddenYears)}</span>
            </p>
          ) : null}
        </Narration>
      ) : null}

      {fate.flow ? (
        <div className="mt-10">
          <YulTalk lines={flowLines(fate.flow, chart)} slot="teaseTiming" type={type} glyph="運" label={F.talk.flow.lead} />
        </div>
      ) : null}
      {fate.flow ? (
        <Narration serif className="rs-fate rs-fate--flow">
          <h3 className="rs-fate__head">{F.drawers.flow.head(name)}</h3>
          <p className="rs-fate__sub">{F.drawers.flow.sub}</p>
          <FlowChart flow={fate.flow} locked />
          <p className="rs-fate__more">
            <LockIcon size={16} /> <span>{F.drawers.flow.more}</span>
          </p>
        </Narration>
      ) : null}

      <div className="mt-10">
        <YulTalk lines={partnerLines(fate.partner)} slot="teasePeople" type={type} glyph="緣" label={F.talk.partner.lead} />
      </div>
      <Narration serif className="rs-fate rs-fate--partner">
        <h3 className="rs-fate__head">{F.drawers.partner.head(name)}</h3>
        <p className="rs-fate__sub">{F.drawers.partner.sub}</p>
        <PartnerCard partner={fate.partner} kind={fate.partnerKind} locked visible={1} sex={chart.input.sex} />
        <p className="rs-fate__more">
          <LockIcon size={16} /> <span>{F.drawers.partner.more}</span>
        </p>
      </Narration>
    </section>
  );
}
