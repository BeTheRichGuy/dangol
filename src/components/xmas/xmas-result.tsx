'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState, type CSSProperties, type ReactNode } from 'react';
import { XMAS_QUIZ } from '@/content/ko/xmas-quiz';
import { XMAS_FLOW } from '@/content/xmas';
import { useLocale } from '../locale-provider';
import { useXmasTitle } from './xmas-landing';
import { xmasDays } from '@/lib/xmas/pulls';
import { XMAS_SEASON } from '@/lib/xmas/season';
import type { Chart } from '@/lib/saju';
import { loadXmasOffer, saveXmasOffer } from '@/lib/xmas/offer-store';
import { XMAS_DEAL, XMAS_LIST } from '@/lib/xmas/product';
import { useAnswers } from '../flow/answers';
import { buildResultModel } from '../result/result-data';
import { markContinue, XMAS_ROOM_PATH } from '../rooms/continue';
import { tossFailure } from '../rooms/toss-checkout';
import { dodoCancelled } from '../rooms/dodo-checkout';
import { StoryBeats } from '../story/story-strip';
import type { Beat } from '../story/types';
import '../story/story-strip.css';
import './xmas-landing.css';
import './xmas-flow.css';
import { FrostWipe, HoldToPull } from './xmas-play';
import { XmasPairStrands } from './xmas-pair-strands';
import { computeChart } from '@/lib/saju/engine';
import { markPulled, markXmasFrom, parseXmasInput, useHydrated, useXmasRaw, wasPulled, xmasReturnPath } from './xmas-store';
import { XMAS_HOOKS } from '@/content/xmas-hooks';
import { pastMonths, rivalDays, rivalElement, seenKey } from '@/lib/xmas/hooks';
import { callName } from '@/lib/xmas/call-name';
import { xmasCalendarRange } from '@/lib/xmas/pulls';
import { XhGold, XhPast, XhRival, XhSeen } from './xmas-hooks';
import { XmasViewers } from './xmas-viewers';
import { Countdown, Mark, XmasPitch } from './xmas-pitch';

export { formatLeft } from './xmas-pitch';
import { track } from '@/lib/analytics/track';

const R = XMAS_FLOW.result;
const HK = XMAS_HOOKS;

function named(beats: readonly Beat[], name: string): Beat[] {
  return beats.map((b) => (b.kind === 'art' ? { ...b, says: b.says?.map((s) => ({ ...s, text: s.text.replace('{name}', name) })) } : b));
}

export function moveDayCount(chart: Chart, nowIso: string): number {
  return xmasDays(chart, nowIso).filter((d) => (d.kind === 'close' || d.kind === 'group') && d.date <= XMAS_SEASON.eve).length;
}

function Marked({ text }: { text: string }) {
  return (
    <>
      {text.split('*').map((part, i) => (i % 2 === 1 ? <em key={i}>{part}</em> : part))}
    </>
  );
}

function useSectionSeen(active: boolean, name: 'xmas_section' | 'quiz_section') {
  useEffect(() => {
    if (!active) return;
    const seen = new Set<string>();
    const io = new IntersectionObserver((entries) => {
      for (const e of entries) {
        const at = (e.target as HTMLElement).dataset.xsec;
        if (!e.isIntersecting || !at || seen.has(at)) continue;
        seen.add(at);
        io.unobserve(e.target);
        track(name, { at });
      }
    });
    document.querySelectorAll<HTMLElement>('[data-xsec]').forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [active, name]);
}

const SCROLL_KEY = 'dangol:xmas-scroll';

function saveScroll() {
  try {
    sessionStorage.setItem(SCROLL_KEY, JSON.stringify({ y: window.scrollY, t: Date.now() }));
  } catch {

  }
}

function useRestoreScroll(ready: boolean) {
  useEffect(() => {
    if (!ready) return;
    let y = 0;
    try {
      const raw = sessionStorage.getItem(SCROLL_KEY);
      sessionStorage.removeItem(SCROLL_KEY);
      const v = raw ? (JSON.parse(raw) as { y?: unknown; t?: unknown }) : null;
      if (v && typeof v.y === 'number' && typeof v.t === 'number' && Date.now() - v.t < 30 * 60 * 1000) y = v.y;
    } catch {
      return;
    }
    if (y <= 0) return;

    let raf = 0;
    const stop = Date.now() + 1500;
    const go = () => {
      if (Math.abs(window.scrollY - y) > 2) window.scrollTo({ top: y, behavior: 'instant' });
      if (Date.now() < stop) raf = requestAnimationFrame(go);
    };
    raf = requestAnimationFrame(go);
    const cancel = () => cancelAnimationFrame(raf);

    window.addEventListener('touchstart', cancel, { once: true, passive: true });
    window.addEventListener('wheel', cancel, { once: true, passive: true });
    return () => {
      cancel();
      window.removeEventListener('touchstart', cancel);
      window.removeEventListener('wheel', cancel);
    };
  }, [ready]);
}

type Offer = { token: string; until: number };

function useXmasOffer(enabled: boolean): Offer | null {
  const [offer, setOffer] = useState<Offer | null>(null);
  useEffect(() => {
    if (!enabled) return;
    let live = true;
    const saved = loadXmasOffer();
    const got = saved
      ? Promise.resolve<Offer | null>(saved)
      : fetch('/api/xmas/offer', { method: 'POST' })
          .then((r) => (r.ok ? (r.json() as Promise<Partial<Offer>>) : null))
          .then((o) => (o && typeof o.token === 'string' && typeof o.until === 'number' ? { token: o.token, until: o.until } : null))
          .catch(() => null);
    void got.then((o) => {
      if (!live || !o) return;
      if (!saved) saveXmasOffer(o);
      setOffer(o);
    });
    return () => {
      live = false;
    };
  }, [enabled]);
  return offer;
}

export interface XmasResultQuiz {
  onPay: () => void;
  head: ReactNode;

  bridgeIn?: ReactNode;

  beforePitch?: ReactNode;

  tail?: ReactNode;
}

export function XmasResult({ quiz }: { quiz?: XmasResultQuiz } = {}) {
  const router = useRouter();
  const locale = useLocale();
  useXmasTitle(locale);
  const DEAL = XMAS_DEAL[locale].text;
  const LIST = XMAS_LIST[locale].text;
  const hydrated = useHydrated();
  const answers = useAnswers();
  const input = parseXmasInput(useXmasRaw());

  const model = useMemo(() => (hydrated ? buildResultModel(answers) : null), [hydrated, answers]);
  const offer = useXmasOffer(model !== null && !quiz);
  const [ended, setEnded] = useState(false);
  const onEnd = useCallback(() => setEnded(true), []);

  const [pulledNow, setPulledNow] = useState(false);
  const pulled = Boolean(quiz) || pulledNow || (hydrated && wasPulled());
  useSectionSeen(pulled && model !== null && input !== null, quiz ? 'quiz_section' : 'xmas_section');
  useRestoreScroll(pulled && model !== null && input !== null);

  useEffect(() => {
    if (dodoCancelled(window.location.search)) {
      track('pay_cancel', { room: 'love', provider: 'dodo', xmas: 1 });
      router.replace(xmasReturnPath());
      return;
    }
    const code = tossFailure(window.location.search);
    if (code === null) return;
    const cancel = code === 'PAY_PROCESS_CANCELED' || code === 'USER_CANCEL';
    track(cancel ? 'pay_cancel' : 'pay_fail', { room: 'love', provider: 'toss', code, xmas: 1 });
    router.replace(xmasReturnPath());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!hydrated) return <main className="sd-page xm" lang={locale} />;
  if (!model || !input) {
    return (
      <main className="sd-page xm" lang={locale}>
        <div className="sd xr-missing">
          <p>{R.missing.title}</p>
          <Link href="/xmas/start">{R.missing.button}</Link>
        </div>
      </main>
    );
  }

  const name = callName(answers.name);
  const { chart } = model;
  const pillars = [chart.pillars.year, chart.pillars.month, chart.pillars.day, chart.pillars.hour];
  const moves = moveDayCount(chart, model.nowIso);

  const past = pastMonths(chart, model.nowIso);
  const rivals = rivalDays(chart, model.nowIso).length;
  const goldFrom = xmasCalendarRange(model.nowIso).from;
  const goldTo = `${XMAS_SEASON.eve.slice(0, 7)}-31`;
  const hearts = xmasDays(chart, model.nowIso)
    .filter((d) => (d.kind === 'close' || d.kind === 'group') && d.date <= XMAS_SEASON.eve)
    .map((d) => d.date);

  let other: Chart | null = null;
  try {
    other = input.partner ? computeChart({ date: input.partner.date, time: input.partner.time, place: chart.input.place, sex: null }) : null;
  } catch {
    other = null;
  }

  const deal = Boolean(quiz) || (offer !== null && !ended);

  const payNote = !quiz && deal && R.locked.payNote ? R.locked.payNote.replace('{list}', LIST).replace('{deal}', DEAL) : null;

  function pay() {
    saveScroll();
    if (quiz) return quiz.onPay();

    markXmasFrom('result');
    markContinue('love', 'free_result', Date.now(), true, 'xmas');

    router.push(XMAS_ROOM_PATH);
  }

  if (!pulled) {
    return (
      <main className="sd-page xm" lang={locale}>
        <div className="sd xr">
          <StoryBeats beats={named(R.intro.slice(0, 1), name)} />
          <HoldToPull
            {...R.play.pull}
            onDone={() => {
              track('xmas_section', { at: 'pull' });
              markPulled();
              setPulledNow(true);
            }}
          />
        </div>
      </main>
    );
  }

  return (
    <main className="sd-page xm" lang={locale}>
      <div className="sd xr">
        {quiz ? quiz.head : null}
        {quiz ? quiz.bridgeIn : null}
        <StoryBeats beats={named(R.intro, name)} />

        {}
        <section className="xr-strands" aria-label={R.pillars.title.replace('{name}', name)}>
          <h2>{R.pillars.title.replace('{name}', name)}</h2>
          <ol>
            {pillars.map((p, i) => (
              <li key={i} style={{ '--i': i } as CSSProperties} data-empty={p ? undefined : ''}>
                <b>{p ? p.stem : '·'}</b>
                <b>{p ? p.branch : '·'}</b>
                <span>{p ? R.pillars.labels[i] : R.pillars.unknown}</span>
              </li>
            ))}
          </ol>
        </section>

        {}
        <section className="xr-pair" aria-label={R.pair.title.replace('{name}', name)}>
          {other ? (
            <>
              <h2>{R.pair.title.replace('{name}', name)}</h2>
              <XmasPairStrands me={chart} other={other} copy={{ me: R.pair.me, other: R.pair.other, labels: R.pillars.labels, unknown: R.pair.unknown }} />
              <p className="xr-pair__note">{other.pillars.hour ? R.pair.note : `${R.pair.noTime}\n${R.pair.note}`}</p>
            </>
          ) : (
            <p className="xr-pair__note">{R.pair.none}</p>
          )}
        </section>

        {}
        <section className="xr-insight" aria-label={R.insight.over}>
          <p className="xr-card__over">{R.insight.over}</p>
          <dl>
            <div>
              <dt>{R.insight.now}</dt>
              <dd>{R.insight.stage[input.relation.stage]}</dd>
            </div>
            <div>
              <dt>{R.insight.want}</dt>
              <dd>{R.insight.goal[input.relation.goal]}</dd>
            </div>
          </dl>
          <p className="xr-insight__say">
            <span>{R.insight.say}</span>
            {R.insight.line[input.relation.stage]}
          </p>
        </section>

        {}
        <Mark at="past" />
        <StoryBeats beats={HK.past.before} />
        <XhPast months={past} />
        <StoryBeats beats={HK.past.after} />

        {}
        <StoryBeats beats={[R.aha]} />

        {}
        <Mark at="rival" />
        <p className="xh-band">{HK.rival.band}</p>
        <StoryBeats beats={HK.rival.before(name)} />
        <XhRival element={rivalElement(chart)} stage={input.relation.stage} days={rivals} sex={answers.sex} />
        <StoryBeats beats={HK.rival.after} />

        {}
        <Mark at="why" />
        <StoryBeats beats={R.read.beforeWhy} />
        <section className="xr-card xr-card--locked">
          <h2>{HK.why.title}</h2>
          <p className="xr-card__lead">{R.why.lead[input.relation.stage]}</p>
          {}
          <XhSeen k={seenKey(chart)} />
          <p className="xr-card__veil">{R.why.hidden}</p>
        </section>

        {}
        <Mark at="gold" />
        <StoryBeats beats={HK.gold.before} />
        {moves > 0 ? (
          <XhGold from={goldFrom} to={goldTo} hearts={hearts} count={moves} wrapCount={(n) => <FrostWipe {...R.play.frost}>{n}</FrostWipe>} />
        ) : (
          <p className="xr-when__count">
            <Marked text={R.when.none} />
          </p>
        )}

        {}
        <StoryBeats beats={[R.when.trace, { kind: 'me', text: moves > 0 ? HK.gold.ask : R.when.ask, gap: 10 }, R.when.hide]} />
        <StoryBeats beats={HK.gold.after} />

        {quiz ? quiz.beforePitch : null}
        {}
        <XmasPitch
          onPay={pay}
          stage={input.relation.stage}
          sex={answers.sex}
          hasPartner={input.partner !== null}
          price={quiz ? { kind: 'flat' } : { kind: 'offer', until: offer ? offer.until : null, ended, onEnd }}
        />
        {quiz ? quiz.tail : null}
      </div>

      {}
      {}
      <div className="xm-bar xr-bar">
        <p className="xm-bar__tag">
          {quiz ? (
            <>{XMAS_QUIZ.result.price.badge} </>
          ) : deal && offer ? (
            <>
              {R.locked.deal.timer} <Countdown until={offer.until} onEnd={onEnd} />
              <i aria-hidden="true" />
            </>
          ) : null}
          <b>{deal ? DEAL : LIST}</b>
        </p>
        {}
        <XmasViewers className="xm-bar__tag xm-bar__proof" />
        <button type="button" onClick={pay}>
          {quiz ? XMAS_QUIZ.result.button : R.locked.sticky}
        </button>
        {payNote ? <p className="xr-paynote xr-paynote--bar">{payNote}</p> : null}
      </div>
    </main>
  );
}
