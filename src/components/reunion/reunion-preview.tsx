'use client';

import { useEffect, useRef, useState } from 'react';
import { REUNION } from '@/content/reunion';
import { ROOMS_COPY } from '@/content/rooms';
import type { Locale } from '@/content/locale';
import type { TogetherMonth } from '@/lib/reading/fate-map';
import { reunionArtSrc } from '@/lib/reunion/art';
import { REUNION_GUIDE_NAME } from '@/lib/reunion/product';
import { LockIcon } from '../icons';
import { useLocale } from '../locale-provider';
import './reunion.css';

const SEEN = new Set([0, 1, 2]);

const KIND_ORDER = ['both', 'one', 'care', 'even'] as const;

const fillGuide = (text: string, locale: Locale): string => text.replaceAll('{guide}', REUNION_GUIDE_NAME[locale].name);

export function frostSplit(text: string, locale: Locale): { clear: string; rest: string } {
  if (locale === 'en') {
    const words = text.split(' ');
    return { clear: words.slice(0, 3).join(' '), rest: words.length > 3 ? ` ${words.slice(3).join(' ')}` : '' };
  }
  const chars = [...text];
  return { clear: chars.slice(0, 6).join(''), rest: chars.slice(6).join('') };
}

const prefersReduced = (): boolean => typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

function useCountUp(target: number, run: boolean): number {
  const [n, setN] = useState(0);
  const [still] = useState(prefersReduced);
  useEffect(() => {
    if (!run || still || target <= 0) return;
    const start = performance.now();
    const ms = 900;
    let raf = 0;
    const tick = (t: number) => {
      const k = Math.min(1, (t - start) / ms);
      setN(Math.round(target * (1 - (1 - k) * (1 - k))));
      if (k < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, run, still]);
  return still || target <= 0 ? target : n;
}

function useSeen(): [React.RefObject<HTMLDivElement | null>, boolean] {
  const ref = useRef<HTMLDivElement>(null);
  const [seen, setSeen] = useState(() => typeof IntersectionObserver === 'undefined');
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === 'undefined') return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setSeen(true);
          io.disconnect();
        }
      },
      { threshold: 0.25 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return [ref, seen];
}

function WindowTeaser({ months }: { months: readonly TogetherMonth[] }) {
  const P = REUNION.preview;
  const [ref, seen] = useSeen();
  const counts = { both: 0, one: 0, care: 0, even: 0 };
  for (const m of months) counts[m.kind] += 1;

  const headline = counts.both > 0 ? counts.both : counts.one;
  const lead = counts.both > 0 ? P.windowLeadBoth(counts.both, months.length) : counts.one > 0 ? P.windowLeadOne(counts.one, months.length) : P.windowNone;
  const shown = useCountUp(headline, seen);
  return (
    <section ref={ref} className="ru-pv-window" aria-label={P.windowTitle}>
      <h3 className="ru-pv-sub">{P.windowTitle}</h3>
      {headline > 0 ? (
        <p className="ru-pv-big" aria-label={lead}>
          <strong aria-hidden="true">{shown}</strong>
          <span aria-hidden="true">/ {months.length}</span>
        </p>
      ) : null}
      <p className="ru-pv-lead">{lead}</p>
      <ol className="ru-wm" aria-hidden="true">
        {months.map((m) => (
          <li key={`${m.year}-${m.month}`} className="ru-wm__tile" data-kind={m.kind}>
            <span className="ru-frost ru-wm__num">{m.month}</span>
          </li>
        ))}
      </ol>
      <ul className="ru-wm-legend">
        {KIND_ORDER.map((k) =>
          counts[k] > 0 ? (
            <li key={k} data-kind={k}>
              <i aria-hidden="true" />
              {P.windowKinds[k]} <b>{counts[k]}</b>
            </li>
          ) : null,
        )}
      </ul>
      <p className="ru-pv-hint">
        <LockIcon size={14} /> {P.windowHidden}
      </p>
    </section>
  );
}

function FirstLine({ line, locale }: { line: string; locale: Locale }) {
  const P = REUNION.preview;
  const { clear, rest } = frostSplit(line, locale);
  return (
    <section className="ru-pv-first" aria-label={P.firstLineTitle}>
      <h3 className="ru-pv-sub">{P.firstLineTitle}</h3>
      <p className="ru-pv-bubble">
        <span>{clear}</span>{' '}
        <span className="ru-frost ru-pv-bubble__rest" aria-hidden="true">
          {rest.trimStart()}
        </span>
        <span className="sr-only"> {P.lockedSr}</span>
      </p>
      <p className="ru-pv-hint">
        <LockIcon size={14} /> {P.firstLineNote}
      </p>
    </section>
  );
}

const WEBTOON_THUMBS = ['03-c', '08-b', '12-c'] as const;
const DEFAULT_KINDS = ['both', 'even', 'one', 'even', 'care', 'even', 'both', 'even', 'one', 'even', 'even', 'care'] as const;

function MatVisual({ k, months }: { k: (typeof REUNION.preview.materials)[number]['key']; months: readonly TogetherMonth[] | null }) {
  switch (k) {
    case 'window': {
      const kinds = months && months.length === 12 ? months.map((m) => m.kind) : DEFAULT_KINDS;
      return (
        <span className="ru-mv ru-mv--window" aria-hidden="true">
          {kinds.map((kind, i) => (
            <i key={i} data-kind={kind} />
          ))}
        </span>
      );
    }
    case 'kit':
      return (
        <span className="ru-mv ru-mv--kit" aria-hidden="true">
          <b />
          <b className="ru-frost" />
          <b className="ru-frost" />
        </span>
      );
    case 'check':
      return (
        <span className="ru-mv ru-mv--check" aria-hidden="true">
          {Array.from({ length: 7 }, (_, i) => (
            <i key={i} data-on={i < 3 ? '1' : '0'} />
          ))}
        </span>
      );
    case 'rules':
      return (
        <span className="ru-mv ru-mv--rules" aria-hidden="true">
          <b />
          <b />
          <b />
          <em>
            {Array.from({ length: 10 }, (_, i) => (
              <i key={i} />
            ))}
          </em>
        </span>
      );
    case 'letgo':
      return (
        <span className="ru-mv ru-mv--letgo" aria-hidden="true">
          {Array.from({ length: 5 }, (_, i) => (
            <i key={i} />
          ))}
        </span>
      );
    case 'save':
      return (
        <span className="ru-mv ru-mv--save" aria-hidden="true">
          <b />
          <b />
          <b />
        </span>
      );
    case 'webtoon':
      return (
        <span className="ru-mv ru-mv--webtoon" aria-hidden="true">
          {WEBTOON_THUMBS.map((name) => (
            <i key={name} style={{ backgroundImage: `url(${reunionArtSrc(name)})` }} />
          ))}
        </span>
      );
  }
}

export function ReunionMaterials({ months = null }: { months?: readonly TogetherMonth[] | null }) {
  const locale = useLocale();
  const P = REUNION.preview;
  return (
    <section className="ru-pv-mats" aria-label={P.materialsTitle}>
      <h3 className="ru-pv-sub">{P.materialsTitle}</h3>
      <p className="ru-pv-lead">{P.materialsLead}</p>
      <ul className="ru-mats">
        {P.materials.map((m) => (
          <li key={m.key} className="ru-mat" data-key={m.key}>
            <MatVisual k={m.key} months={months} />
            <span className="ru-mat__body">
              <span className="ru-mat__name">{m.name}</span>
              <span className="ru-mat__line">{fillGuide(m.line, locale)}</span>
              <span className="ru-mat__count">{m.count}</span>
            </span>
          </li>
        ))}
      </ul>
      <p className="ru-pv-format">{P.format}</p>
    </section>
  );
}

export function ReunionContents({ seen = true }: { seen?: boolean }) {
  const P = REUNION.preview;
  const contents = ROOMS_COPY.reunion.contents;
  return (
    <section className="ru-pv-toc" aria-label={P.contentsTitle}>
      <h3 className="ru-pv-sub">{P.contentsTitle}</h3>
      {seen ? <p className="ru-pv-legend">{P.contentsLegend}</p> : null}
      <ol className="ru-toc">
        {contents.map((c, i) => (
          <li key={c.title} className="ru-toc__item">
            <span className="ru-toc__n" aria-hidden="true">
              {String(i + 1).padStart(2, '0')}
            </span>
            <span className="ru-toc__title">{c.title}</span>
            {seen ? (
              <span className="ru-toc__tag" data-kind={SEEN.has(i) ? 'seen' : 'new'}>
                {SEEN.has(i) ? P.tags.seen : P.tags.new}
              </span>
            ) : null}
            <span className="ru-toc__line">{c.line}</span>
          </li>
        ))}
      </ol>
      {seen ? <p className="ru-pv-hint">{P.seenFootnote}</p> : null}
    </section>
  );
}

export function ReunionPreview({ months, firstLine }: { months: readonly TogetherMonth[] | null; firstLine: string | null }) {
  const locale = useLocale();
  const P = REUNION.preview;
  return (
    <section className="ru-pv" aria-label={P.eyebrow}>
      <p className="ru-pv-eyebrow">{P.eyebrow}</p>
      <ReunionContents />
      {months && months.length > 0 ? <WindowTeaser months={months} /> : null}
      {firstLine ? <FirstLine line={firstLine} locale={locale} /> : null}
      <ReunionMaterials months={months} />
    </section>
  );
}
