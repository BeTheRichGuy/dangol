import type { ReunionContent } from '@/lib/reunion/types';
import { dateCards, type MonthKind } from '@/lib/reunion/cards';
import { splitNote } from '@/components/reunion/cards/plan';
import { WANT_IDS } from '@/lib/reunion/intake';
import { calendarFrom, type SaveCard, type SaveLimits } from './params';

export interface DateRow {
  kind: MonthKind;
  when: string;
  label: string;
  action: string;
}

export type SaveCardBody =
  | { kind: 'window'; rows: DateRow[] }
  | { kind: 'kit'; tones: { name: string; line: string }[]; dontTitle: string; dont: string[] }
  | { kind: 'waiting'; title: string; rules: string[] }
  | { kind: 'song'; line: string; datesLabel: string; dates: string[] };

export interface SaveCardModel {
  name: string;
  caption: string;
  footer: string;
  body: SaveCardBody;
}

export function limitsOf(copy: ReunionContent): SaveLimits {
  const K = copy.cards.kit;
  return { plain: K.tones.plain.lines.length, apology: K.tones.apology.lines.length, news: K.tones.news.lines.length, dontSend: K.dontSend.length };
}

export function buildSaveModel(card: SaveCard, copy: ReunionContent): SaveCardModel {
  const S = copy.cards.save;
  const W = copy.cards.window;
  const label = (y: number, m: number) => W.monthLabel(y, m);

  if (card.kind === 'window') {
    const rows = dateCards(calendarFrom(card.from, card.kinds)).map((m) => ({
      kind: m.kind,
      when: label(m.year, m.month),
      label: W.kinds[m.kind].label,
      action: W.kinds[m.kind].actions[m.action],
    }));
    return { name: S.window.name, caption: S.window.caption, footer: S.footer, body: { kind: 'window', rows } };
  }

  if (card.kind === 'kit') {
    const K = copy.cards.kit;
    if (card.mode === 'waiting') {
      return { name: S.kit.name, caption: S.kit.caption, footer: S.footer, body: { kind: 'waiting', title: K.waiting.title, rules: [...K.waiting.rules] } };
    }
    const tones = [
      { name: K.tones.plain.name, line: splitNote(K.tones.plain.lines[card.plain]).quote },
      { name: K.tones.apology.name, line: splitNote(K.tones.apology.lines[card.apology]).quote },
      { name: K.tones.news.name, line: splitNote(K.tones.news.lines[card.news]).quote },
    ];

    const dont = card.dontSend.map((i) => splitNote(K.dontSend[i]).quote);
    return { name: S.kit.name, caption: S.kit.caption, footer: S.footer, body: { kind: 'kit', tones, dontTitle: K.dontSendTitle, dont } };
  }

  const want = WANT_IDS[Math.floor(card.line / 3)];
  return {
    name: S.song.name,
    caption: S.song.caption,
    footer: S.footer,
    body: { kind: 'song', line: S.songLines[want][card.line % 3], datesLabel: S.song.datesLabel, dates: card.dates.map((d) => label(d.year, d.month)) },
  };
}

export function modelText(model: SaveCardModel): string {
  const b = model.body;
  const parts: string[] = [model.name, model.caption, model.footer, 'DANGOL', '0123456789-.,:·「」()', ' '];
  if (b.kind === 'window') for (const r of b.rows) parts.push(r.when, r.label, r.action);
  else if (b.kind === 'kit') parts.push(b.dontTitle, ...b.tones.flatMap((t) => [t.name, t.line]), ...b.dont);
  else if (b.kind === 'waiting') parts.push(b.title, ...b.rules);
  else parts.push(b.line, b.datesLabel, ...b.dates);
  return parts.join('');
}
