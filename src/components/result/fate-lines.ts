import { FATE as F } from '@/content/fate-map';
import { chapterStartDates } from '@/lib/reading/chapter-dates';
import { flowTurn, openMonth, type FlowMap, type KeyMonth, type KeyYear, type PartnerTraits } from '@/lib/reading/fate-map';
import type { Chart } from '@/lib/saju';
import { balloonsMax } from './balloons';

const T = F.talk;

const bubbles = (parts: string[][]): string[] => parts.flatMap((p) => balloonsMax(p.join(' ')));

export function yearsLines(years: readonly KeyYear[], thisYear: number, visible: number, name: string, months: readonly KeyMonth[] = []): string[] {
  const open = years.slice(0, visible);
  if (open.length === 0) return [];
  const one = (y: KeyYear, i: number) => {
    const label = T.years.label(y.year, thisYear);
    const m = openMonth(months, y.year, i);
    return m ? T.years.month(label, m.month, m.tone) : T.years.says(label, F.yearTitle(y));
  };

  const fix = years.some((y) => y.kind === 'crisis') ? [[T.years.fix]] : [];
  return bubbles([[T.years.lead(name)], open.map(one), ...fix, [T.years.more(years.length - open.length)]]);
}

export function flowLines(flow: FlowMap, chart: Chart): string[] {
  const turn = flowTurn(flow, chapterStartDates(chart));
  if (!turn) return [];
  const parts = [[T.flow.lead], [T.flow.now(turn.now.group, turn.now.level)]];
  if (turn.next && turn.start) parts.push([T.flow.next]);
  parts.push([T.flow.more]);
  return bubbles(parts);
}

export function partnerLines(partner: PartnerTraits): string[] {
  return bubbles([[T.partner.lead, T.partner.vibe(partner.vibe)], [T.partner.more]]);
}
