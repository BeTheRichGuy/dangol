import type { MonthKind } from './cards';
import type { ContactId, LengthId, ReasonId, SinceId, WantId, WhoId } from './intake';
import type { FilledKey, FlowKey, FrayedKey } from './pick';

export interface ChoiceCopy<Id extends string> {
  id: Id;
  label: string;
  reaction: string;
}

export interface QuestionCopy<Id extends string> {
  ask: string;
  options: readonly ChoiceCopy<Id>[];
}

export interface ResultCard {
  title: string;
  body: string;
}

export interface LockedCard {
  title: string;
  line: string;
}

export interface PathCopy {

  id: 'reach' | 'wait' | 'letgo';
  name: string;

  when: string;

  timing: string;

  relief: string;
}

export interface RuleCopy {
  title: string;
  line: string;
}

export interface PreviewCopy {
  eyebrow: string;
  contentsTitle: string;
  contentsLegend: string;
  tags: { seen: string; new: string };
  seenFootnote: string;
  windowTitle: string;

  windowLeadBoth: (n: number, total: number) => string;
  windowLeadOne: (n: number, total: number) => string;
  windowNone: string;
  windowHidden: string;
  windowKinds: Record<MonthKind, string>;
  materialsTitle: string;
  materialsLead: string;
  materials: readonly { key: 'window' | 'kit' | 'check' | 'rules' | 'letgo' | 'save' | 'webtoon'; name: string; line: string; count: string }[];
  firstLineTitle: string;
  firstLineNote: string;
  lockedSr: string;
  format: string;
}

export interface ReunionContent {

  hook: { title: string; sub: string };
  preview: PreviewCopy;

  hello: { lines: readonly string[]; cta: string };

  birth: {
    meAsk: string;
    themAsk: string;
    themTimeHint: string;

    nicknameLabel: string;
    nicknamePlaceholder: string;

    pickSaved: string;
    next: string;
  };

  intake: {
    since: QuestionCopy<SinceId>;
    length: QuestionCopy<LengthId>;
    who: QuestionCopy<WhoId>;

    reasons: QuestionCopy<ReasonId> & { limit: string; done: string };
    contact: QuestionCopy<ContactId>;
    want: QuestionCopy<WantId>;
    concern: { ask: string; placeholder: string; optional: string; skip: string; submit: string; counter: string };
  };

  ritual: readonly [string, string, string];

  result: {
    heading: string;

    labels: Record<FrayedKey, { name: string; tagline: string }>;
    flow: Record<FlowKey, ResultCard>;
    filled: Record<FilledKey, ResultCard>;
    frayed: Record<FrayedKey, ResultCard>;
    contact: Record<ContactId, ResultCard>;
    want: Record<WantId, ResultCard>;

    locked: readonly [LockedCard, LockedCard, LockedCard];
    lockedHint: string;
    sections: { first: string; frayed: string; filled: string; yours: string; locked: string };

    concernCard: { title: string; echo: string };
    labelEyebrow: string;
    share: string;
    shareCopied: string;

    shareText: string;
  };

  pitch: {
    lines: readonly string[];

    button: string;

    ticketNote: string;

    region: string;
    note: string;
  };

  safety: { title: string; body: string };

  ui: {
    back: string;
    stepOf: (n: number, total: number) => string;
    editAnswers: string;
    startOver: string;
  };

  product: {
    includesTitle: string;

    includes: readonly string[];

    gate: { title: string; body: string; cta: string; payNote: string };

    movements: readonly [string, string, string, string];

    summary: (parts: { since: string; who: string; want: string }) => string;
  };

  cards: {

    readiness: { title: string; intro: string; items: readonly [string, string, string, string, string, string, string]; footer: string };

    paths: { title: string; intro: string; rows: { when: string; timing: string; relief: string }; columns: readonly [PathCopy, PathCopy, PathCopy]; noMonth: string };

    window: {
      title: string;
      intro: string;
      kinds: Record<MonthKind, { label: string; actions: readonly [string, string, string] }>;

      cardHead: (n: number) => string;

      monthLabel: (year: number, month: number) => string;
      footer: string;
    };

    kit: {
      title: string;
      intro: string;
      tones: { plain: { name: string; lines: readonly string[] }; apology: { name: string; lines: readonly string[] }; news: { name: string; lines: readonly string[] } };

      branches: readonly [
        { name: string; next: string; stop: string },
        { name: string; next: string; stop: string },
        { name: string; next: string; stop: string },
      ];

      dontSend: readonly string[];
      dontSendTitle: string;

      waiting: { title: string; rules: readonly string[] };
      timeTitle: string;

      timeLine: string;
      copy: string;
      copied: string;
    };

    days: { title: string; intro: string; nodes: readonly { range: string; title: string; line: string }[] };
    rules: { title: string; intro: string; byFrayed: Record<FrayedKey, readonly [RuleCopy, RuleCopy, RuleCopy]>; warningsTitle: string; warnings: readonly [string, string, string] };

    letgo: {
      title: string;
      intro: string;
      steps: readonly { title: string; line: string }[];
      letter: { title: string; prompts: readonly string[] };
      signalsTitle: string;
      signals: readonly [string, string, string];
    };

    save: {
      title: string;
      button: string;
      saved: string;
      failed: string;
      window: { name: string; caption: string };
      kit: { name: string; caption: string };
      song: { name: string; caption: string; datesLabel: string };

      songLines: Record<WantId, readonly [string, string, string]>;
      footer: string;
    };
  };
}
