'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { UI } from '@/content/ui';
import type { Chart } from '@/lib/saju';
import { ChevronLeftIcon } from '../icons';
import { GlyphRise, MysticDust, RevealText } from '../mystic';
import { bubbleDelay } from '../result/balloons';
import { useReducedMotion } from '../use-reduced-motion';
import { Bubble, Panel } from '../webtoon';
import '../rooms/rooms.css';
import { stepNav } from './steps';
import './reading-form.css';

const RITUAL_ART = '/media/webtoon/yul-form-ritual.jpg';

const START_MS = 1400;
const START_REDUCED_MS = 200;
const HOLD_MS = 400;
const HOLD_REDUCED_MS = 500;
const WASH_MS = 360;
const WASH_REDUCED_MS = 200;
const FALLBACK_MS = 7000;

export function ReadingRitual({ chart, line }: { chart: Chart | null; line: string }) {
  const reduced = useReducedMotion();
  const [rising, setRising] = useState(false);
  const [wash, setWash] = useState(false);
  const startWash = useCallback(() => setWash(true), []);

  useEffect(() => {
    if (!chart) return;
    const t = window.setTimeout(() => setRising(true), reduced ? START_REDUCED_MS : START_MS);
    return () => window.clearTimeout(t);
  }, [chart, reduced]);

  const pillars = chart ? [chart.pillars.year, chart.pillars.month, chart.pillars.day, chart.pillars.hour].filter((p): p is NonNullable<typeof p> => p !== null) : [];

  const glyphs = pillars.flatMap((p) => [p.stem, p.branch]);

  return (
    <div className="rf-screen rf-guided rf-ritual">
      {}
      <div aria-hidden="true" className="rf-backdrop">
        {/* eslint-disable-next-line @next/next/no-img-element -- 흐리게 까는 배경이라 최적화가 필요 없다 */}
        <img src={RITUAL_ART} alt="" />
      </div>
      {chart ? <MysticDust className="rf-ritual__bgdust" density={0.6} /> : null}
      <main id="main" className="rf-main">
        <div className="rf-top">
          {chart ? null : (
            <button type="button" className="rf-back" onClick={() => stepNav.replace('form')} aria-label={UI.common.back}>
              <ChevronLeftIcon size={22} />
            </button>
          )}
        </div>
        <div className="rf-form">
          <section className="rf-lead">
            <Panel
              image={RITUAL_ART}
              alt=""
              aspect="square"
              eager
              bloom
              layer={chart ? <MysticDust className="rf-ritual__dust" /> : null}
            >
              <Bubble side="left" tail="none" delayMs={bubbleDelay(0)}>
                <p className="rm-lines">
                  <RevealText text={line} delayMs={bubbleDelay(0)} />
                </p>
              </Bubble>
            </Panel>
          </section>
          {}
          {chart ? <div className="rf-ritual__stage">
              <div aria-hidden="true" className="rf-ritual__rings" data-on={rising ? 'true' : 'false'} />
              {rising ? <RitualGlyphs glyphs={glyphs} onWash={startWash} /> : null}
            </div> : null}
          {chart ? null : (
            <div className="rf-submit">
              <button type="button" className="rf-next" aria-disabled="false" onClick={() => stepNav.replace('form')}>
                {UI.reading.steps.ritual.failedAction}
              </button>
            </div>
          )}
        </div>
      </main>
      {wash ? <div aria-hidden="true" className="dg-fixed-layer dg-wash dg-wash--in" /> : null}
    </div>
  );
}

function RitualGlyphs({ glyphs, onWash }: { glyphs: string[]; onWash: () => void }) {
  const reduced = useReducedMotion();
  const finished = useRef(false);
  const timers = useRef<number[]>([]);

  const finish = useCallback(() => {
    if (finished.current) return;
    finished.current = true;
    const hold = reduced ? HOLD_REDUCED_MS : HOLD_MS;
    const washMs = reduced ? WASH_REDUCED_MS : WASH_MS;
    timers.current.push(
      window.setTimeout(onWash, hold),
      window.setTimeout(() => {
        stepNav.replace('result');
        window.scrollTo(0, 0);
      }, hold + washMs),
    );
  }, [reduced, onWash]);

  useEffect(() => {
    const fallback = window.setTimeout(finish, FALLBACK_MS);
    return () => window.clearTimeout(fallback);
  }, [finish]);

  useEffect(() => {
    const list = timers.current;
    return () => list.forEach((t) => window.clearTimeout(t));
  }, []);

  return (
    <div aria-hidden="true" className="rf-ritual__glyphs">
      <GlyphRise glyphs={glyphs} onDone={finish} veil={false} />
    </div>
  );
}
