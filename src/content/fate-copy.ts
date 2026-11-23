import type { FlowDirection, FlowLevel, KeyMonthTone, KeyYear, MonthTone, PartnerTypeKey, StageKey, YearKind } from '@/lib/reading/fate-map';
import type { Element, GodGroup } from '@/lib/saju/types';
import type { FateCopy } from './ko/fate-map';

export type { FateCopy };

type G = Record<GodGroup, string>;
type E = Record<Element, string>;
interface Named {

  named: string;

  plain: string;
}

export interface FateData {
  stageLabel: Record<StageKey, string>;
  stageAges: Record<StageKey, string>;
  levelWord: Record<FlowLevel, string>;
  kindTag: Record<YearKind, string>;
  year: {

    crisis: G;
    chance: G;
    flow: G;
    clashDay: string;
    clashMonth: string;
    shift: string;
    chanceHarmony: string;

    tipCrisis: G;
    tipChance: G;
    tipFlow: G;
    tipClashDay: string;
    tipClashMonth: string;
    tipShift: string;
    tipChanceHarmony: string;

    label: { thisYear: string; nextYear: string; other: string };
  };

  months: {
    at: string;
    names?: string[];
    tag: { caution: string; good: string };
    tone: Record<KeyMonthTone, string>;

    prep: Record<KeyMonthTone, string>;

    both: string;
  };
  partner: {
    keys: { vibe: string; temper: string; meet: string };
    vibe: G;
    temper: E;
    meet: G;
    types: Record<PartnerTypeKey, { name: string; who: string; look: string; ease: string; care: string }>;
    faces: { label: string; f: string; m: string };
    typeKeys: { ease: string; care: string };

    alt: string;
  };
  flow: {

    theme: G;

    nowTail: Record<FlowLevel, string>;
  };
  talk: {
    years: {
      leadNamed: string;
      leadPlain: string;

      label: { thisYear: string; nextYear: string; other: string };

      says: string;

      monthSays: string;

      more: string;

      fix: string;
    };
    flow: {
      lead: string;

      now: string;

      next: string;
      more: string;
    };
    partner: { lead: string;  vibe: string; more: string };
  };
  drawers: {
    lead: string;
    hiddenSr: string;
    years: { head: Named; sub: string;  more: string;  fix: string };
    flow: { head: Named; sub: string; locked: string; here: string; more: string };
    partner: { head: Named; sub: string; more: string };
  };
  paid: {
    eyebrow: string;
    intro: string;
    years: { head: string; sub: string; tipLabel: string; fixLabel: string; prepLabel: string; noMonths: string; focusLabel: string; chipsLabel: string; yearOnlyLabel: string; recurHead: string; recurNote: string };
    flow: {
      head: string;
      sub: string;
      here: string;

      best: string;
      hardest: string;
      even: string;

      next: {
        head: string;

        whenMonth: string;
        whenYear: string;

        open: string;
        openFirst: string;
        dir: Record<FlowDirection, string>;
        prepLabel: string;
        prep: Record<FlowDirection, string>;
        firstPrep: string;
      };
      stageHead: string;
      stageFocus: Record<StageKey, string>;
      pace: Record<FlowLevel, string>;
    };
    partner: {
      head: string;
      sub: string;

      when: { head: string; work: string; close: string; none: string; recur: string };
    };
    calendar: {
      head: string;
      sub: string;
      tag: Record<'good' | 'caution' | 'even', string>;
      detail: Record<KeyMonthTone | 'even', string>;
      prepLabel: string;
      prep: Record<KeyMonthTone | 'even', string>;

      label: string;

      short: string;
    };
    lantern: {
      head: string;
      sub: string;
      tag: { past: string; now: string };

      title: string;

      ages: string;

      years: string;

      line: { past: string; now: string; next: string };
      tail: Record<FlowLevel, string>;

      open: { done: string; next: string };
      prepLabel: string;
      prep: Record<FlowLevel, string>;
    };
    heat: {
      head: string;
      sub: string;
      level: Record<'blaze' | 'warm' | 'calm' | 'cool', string>;
      turn: { rise: string; fall: string };
      line: Record<'blaze' | 'warm' | 'calm' | 'cool', string>;
      turnLine: { rise: string; fall: string };
      lichun: string;

      tone: Record<KeyMonthTone, string>;
      prepLabel: string;

      prep: Record<'blaze' | 'warm' | 'calm' | 'cool', string>;
    };
    band: {
      head: string;
      sub: string;
      level: Record<'open' | 'warm' | 'steady' | 'tender', string>;
      best: string;
      line: Record<'open' | 'warm' | 'steady' | 'tender', string>;
      prepLabel: string;
      prep: Record<'open' | 'warm' | 'steady' | 'tender', string>;
      themeLabel: string;
      theme: G;

      label: string;
    };
    match: {
      elements: {
        head: string;
        sub: string;
        me: string;
        you: string;
        name: Record<Element, string>;
        link: Record<'overlap' | 'meFills' | 'youFills' | 'none', string>;

        line: Record<'overlap' | 'meFills' | 'youFills' | 'none', string>;
      };
      together: {
        head: string;
        sub: string;
        me: string;
        you: string;
        kind: Record<'both' | 'one' | 'care' | 'even', string>;

        summary: { some: string; none: string };

        line: Record<'both' | 'one' | 'care' | 'even', string>;

        side: string;
        sideTone: Record<MonthTone, string>;
        prepLabel: string;
        prep: Record<'both' | 'one' | 'care' | 'even', string>;
      };
    };
  };
}

export function fill(tpl: string, v: Record<string, string | number>): string {
  return tpl.replace(/\{(\w+)\}/g, (m, k: string) => (k in v ? String(v[k]) : m));
}

const named = (n: Named, name: string) => {
  const t = name.trim();
  return t ? fill(n.named, { name: t }) : n.plain;
};

const noParen = (s: string) => s.replace(/[(（][^)）]*[)）]/g, '').replace(/\s+/g, ' ').trim();

export function buildFateCopy(d: FateData, ko: FateCopy): FateCopy {
  const yearName = (t: FateData['year']['label'], year: number, thisYear: number) =>
    fill(year === thisYear ? t.thisYear : year === thisYear + 1 ? t.nextYear : t.other, { year });

  const monthWord = (month: number) => d.months.names?.[month - 1] ?? String(month);

  const whenOf = (year: number, month: number | null) =>
    month ? fill(d.paid.flow.next.whenMonth, { month: monthWord(month), year }) : fill(d.paid.flow.next.whenYear, { year });
  return {
    stageLabel: d.stageLabel,
    stageAges: d.stageAges,
    levelWord: d.levelWord,
    kindTag: d.kindTag,
    months: {
      at: (month: number) => fill(d.months.at, { month: monthWord(month) }),
      tag: d.months.tag,
      tone: d.months.tone,
      prep: d.months.prep,
      both: d.months.both,
    },
    talk: {
      years: {
        lead: (name: string) => (name.trim() ? fill(d.talk.years.leadNamed, { name: name.trim() }) : d.talk.years.leadPlain),
        label: (year: number, thisYear: number) => yearName(d.talk.years.label, year, thisYear),
        says: (label: string, title: string) => fill(d.talk.years.says, { label, title: noParen(title) }),
        month: (label: string, month: number, tone: KeyMonthTone) => fill(d.talk.years.monthSays, { label, month: monthWord(month), tone: d.months.tone[tone] }),
        more: (n: number) => fill(d.talk.years.more, { n }),
        fix: d.talk.years.fix,
      },
      flow: {
        lead: d.talk.flow.lead,
        now: (group: GodGroup, level: FlowLevel) => fill(d.talk.flow.now, { theme: d.flow.theme[group], tail: d.flow.nowTail[level] }),
        next: d.talk.flow.next,
        more: d.talk.flow.more,
      },
      partner: {
        lead: d.talk.partner.lead,
        vibe: (g: GodGroup) => fill(d.talk.partner.vibe, { vibe: d.partner.vibe[g] }),
        more: d.talk.partner.more,
      },
    },
    yearTitle(y: KeyYear): string {
      if (y.clash === 'day') return d.year.clashDay;
      if (y.clash === 'month') return d.year.clashMonth;
      if (y.kind === 'crisis') return d.year.crisis[y.group];
      if (y.kind === 'shift') return d.year.shift;
      if (y.kind === 'chance') return y.harmony ? d.year.chanceHarmony : d.year.chance[y.group];
      return d.year.flow[y.group];
    },
    yearTip(y: KeyYear): string {
      if (y.clash === 'day') return d.year.tipClashDay;
      if (y.clash === 'month') return d.year.tipClashMonth;
      if (y.kind === 'crisis') return d.year.tipCrisis[y.group];
      if (y.kind === 'shift') return d.year.tipShift;
      if (y.kind === 'chance') return y.harmony ? d.year.tipChanceHarmony : d.year.tipChance[y.group];
      return d.year.tipFlow[y.group];
    },
    yearLabel: (year: number, thisYear: number) => yearName(d.year.label, year, thisYear),
    partner: {
      keys: d.partner.keys,
      vibe: (g: GodGroup) => d.partner.vibe[g],
      temper: (e: Element) => d.partner.temper[e],
      meet: (g: GodGroup) => d.partner.meet[g],
      types: d.partner.types,
      faces: d.partner.faces,
      typeKeys: d.partner.typeKeys,
      alt: (name: string) => fill(d.partner.alt, { name }),
    },
    drawers: {
      lead: d.drawers.lead,
      hiddenSr: d.drawers.hiddenSr,
      years: { head: (name: string) => named(d.drawers.years.head, name), sub: d.drawers.years.sub, more: (n: number) => fill(d.drawers.years.more, { n }), fix: d.drawers.years.fix },
      flow: { head: (name: string) => named(d.drawers.flow.head, name), sub: d.drawers.flow.sub, locked: d.drawers.flow.locked, here: d.drawers.flow.here, more: d.drawers.flow.more },
      partner: { head: (name: string) => named(d.drawers.partner.head, name), sub: d.drawers.partner.sub, more: d.drawers.partner.more },
    },

    sticky: ko.sticky,
    paid: {
      eyebrow: d.paid.eyebrow,
      intro: d.paid.intro,
      years: d.paid.years,
      flow: {
        head: d.paid.flow.head,
        sub: d.paid.flow.sub,
        here: d.paid.flow.here,
        best: (a: number, b: number, y1: number, y2: number) => fill(d.paid.flow.best, { a, b, y1, y2 }),
        hardest: (a: number, b: number, y1: number, y2: number) => fill(d.paid.flow.hardest, { a, b, y1, y2 }),
        even: d.paid.flow.even,
        next: {
          head: d.paid.flow.next.head,
          opens: (year: number, month: number | null, first: boolean) => fill(first ? d.paid.flow.next.openFirst : d.paid.flow.next.open, { when: whenOf(year, month) }),
          dir: d.paid.flow.next.dir,
          prepLabel: d.paid.flow.next.prepLabel,
          prep: d.paid.flow.next.prep,
          firstPrep: d.paid.flow.next.firstPrep,
        },
        stageHead: d.paid.flow.stageHead,
        stageFocus: d.paid.flow.stageFocus,
        pace: d.paid.flow.pace,
      },
      partner: {
        head: d.paid.partner.head,
        sub: d.paid.partner.sub,
        when: {
          head: d.paid.partner.when.head,
          work: (year: number, month: number) => fill(d.paid.partner.when.work, { when: whenOf(year, month) }),
          close: (year: number, month: number) => fill(d.paid.partner.when.close, { when: whenOf(year, month) }),
          none: d.paid.partner.when.none,
          recur: d.paid.partner.when.recur,
        },
      },
      calendar: {
        head: d.paid.calendar.head,
        sub: d.paid.calendar.sub,
        tag: d.paid.calendar.tag,
        detail: d.paid.calendar.detail,
        prepLabel: d.paid.calendar.prepLabel,
        prep: d.paid.calendar.prep,
        label: (year: number, month: number) => fill(d.paid.calendar.label, { year, month: monthWord(month) }),

        short: (month: number) => fill(d.paid.calendar.short, { month: d.months.names ? monthWord(month).slice(0, 3) : month }),
      },
      lantern: {
        head: d.paid.lantern.head,
        sub: d.paid.lantern.sub,
        tag: d.paid.lantern.tag,
        title: (n: number, a: number, b: number) => fill(d.paid.lantern.title, { n, a, b }),
        ages: (a: number, b: number) => fill(d.paid.lantern.ages, { a, b }),
        years: (y1: number, y2: number) => fill(d.paid.lantern.years, { y1, y2 }),
        line: (group: GodGroup, level: FlowLevel, state: 'past' | 'now' | 'next') =>
          fill(d.paid.lantern.line[state], { theme: d.flow.theme[group], tail: d.paid.lantern.tail[level] }),
        opens: (year: number, month: number | null, state: 'past' | 'now' | 'next') =>
          fill(state === 'next' ? d.paid.lantern.open.next : d.paid.lantern.open.done, { when: whenOf(year, month) }),
        prepLabel: d.paid.lantern.prepLabel,
        prep: d.paid.lantern.prep,
      },
      heat: d.paid.heat,
      band: {
        head: d.paid.band.head,
        sub: d.paid.band.sub,
        level: d.paid.band.level,
        best: d.paid.band.best,
        line: d.paid.band.line,
        themeLabel: d.paid.band.themeLabel,
        theme: d.paid.band.theme,
        label: (year: number, age: number) => fill(d.paid.band.label, { year, age }),
        prepLabel: d.paid.band.prepLabel,
        prep: d.paid.band.prep,
      },
      match: {
        elements: {
          head: d.paid.match.elements.head,
          sub: d.paid.match.elements.sub,
          me: d.paid.match.elements.me,
          you: d.paid.match.elements.you,
          name: d.paid.match.elements.name,
          link: d.paid.match.elements.link,
          line: d.paid.match.elements.line,
        },
        together: {
          head: d.paid.match.together.head,
          sub: d.paid.match.together.sub,
          me: d.paid.match.together.me,
          you: d.paid.match.together.you,
          kind: d.paid.match.together.kind,
          summary: d.paid.match.together.summary,
          line: d.paid.match.together.line,
          side: (who: string, tone: MonthTone) => fill(d.paid.match.together.side, { who, tone: d.paid.match.together.sideTone[tone] }),
          prepLabel: d.paid.match.together.prepLabel,
          prep: d.paid.match.together.prep,
        },
      },
    },
  };
}
