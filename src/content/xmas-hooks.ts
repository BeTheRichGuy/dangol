import type { Beat } from '@/components/story/types';
import type { KeyMonthTone } from '@/lib/reading/fate-map';
import type { Element } from '@/lib/saju/types';
import type { XmasStage } from '@/lib/xmas/relation';
import { XMAS_HOOKS_EN } from './en/xmas-hooks';
import { XMAS_HOOKS_JA } from './ja/xmas-hooks';
import { XMAS_HOOKS_KO } from './ko/xmas-hooks';
import { localized } from './locale';

export interface XmasHooksCopy {

  past: {
    before: Beat[];

    title: string;

    month: (m: number) => string;
    line: Record<KeyMonthTone, string>;
    after: Beat[];
  };

  rival: {
    band: string;

    before: (name: string) => Beat[];
    title: string;

    note: string;

    look: Record<Element, string>;

    from: Record<XmasStage, string>;

    count: string;
    none: string;
    lock: string[];
    after: Beat[];
  };

  why: { title: string };

  seen: {
    lead: string;
    line: Record<SeenKey, string>;

    hint: string;
  };

  gold: {
    before: Beat[];
    title: string;

    first: string;
    date: (m: number, d: number) => string;

    ask: string;

    month: (y: number, m: number) => string;
    weekdays: string[];

    count: string;
    lock: string[];
    after: Beat[];
  };

  lockHead: string;

  fit: {
    over: string;
    title: Record<XmasStage, string>;
    items: Record<XmasStage, { text: string; ch: number[] }[]>;

    ch: string;
    sep: string;
  };

  landing: {
    threat: Beat;
    band: string;

    veil: string;

    veilTail: string;
    result: Beat;
  };

  paid: {

    rivalDay: string;
    title: string;

    fromLead: string;
    daysLead: string;
    date: (m: number, d: number) => string;

    sep: string;
    none: string;
    moveLead: string;

    move: Record<XmasStage, string>;
    seenTitle: string;
  };
}

export type SeenKey = 'peer' | 'output' | 'wealth' | 'power' | 'resource' | 'tension';

export const XMAS_HOOKS = localized<XmasHooksCopy>({ ko: XMAS_HOOKS_KO, en: XMAS_HOOKS_EN, ja: XMAS_HOOKS_JA });
