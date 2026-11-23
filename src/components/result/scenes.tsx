'use client';

import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import { GlyphRise, InkBloom, MysticDust } from '@/components/mystic';
import { landStartMs, landTimeline, lanternArrive } from '@/components/mystic/logic';
import type { Chart } from '@/lib/saju';
import { useReducedMotion } from '../use-reduced-motion';
import { ElementOrbs, PillarLanterns, chartGlyphs, usePanelSeen } from '../webtoon';
import './result.css';

export function DustWhenSeen({ density = 0.6 }: { density?: number }) {
  const seen = usePanelSeen();
  return seen ? <MysticDust density={density} /> : null;
}

type LanternPhase = 'idle' | 'running' | 'done';

const lanternCue = (() => {
  let phase: LanternPhase = 'idle';
  const subs = new Set<() => void>();
  return {
    get: (): LanternPhase => phase,
    set(next: LanternPhase) {
      if (next === phase) return;
      phase = next;
      subs.forEach((fn) => fn());
    },
    subscribe(fn: () => void) {
      subs.add(fn);
      return () => {
        subs.delete(fn);
      };
    },
  };
})();

const SETTLE_MS = 160;

const SAFETY_EXTRA_MS = 1800;

export function LanternScene({ chart }: { chart: Chart }) {
  const reduced = useReducedMotion();
  const panelSeen = usePanelSeen();
  const glyphs = useMemo(() => chartGlyphs(chart), [chart]);
  const [landing, setLanding] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<Element | null>(null);
  const finished = useRef(false);

  const lit = reduced || landing;

  const finish = useCallback(() => {
    if (finished.current) return;
    finished.current = true;
    panelRef.current?.setAttribute('data-mx-hold', 'false');
    lanternCue.set('done');
  }, []);

  useEffect(() => {
    finished.current = false;
    if (reduced) {
      lanternCue.set('done');
      return;
    }
    lanternCue.set('idle');
    const panel = rootRef.current?.closest('.wt-panel') ?? null;
    panelRef.current = panel;
    panel?.setAttribute('data-mx-hold', 'true');
    return () => {
      panel?.removeAttribute('data-mx-hold');
      panelRef.current = null;
      lanternCue.set('idle');
    };
  }, [reduced]);

  useEffect(() => {
    if (reduced || !panelSeen) return;
    if (!finished.current) lanternCue.set('running');
    const total = landStartMs(glyphs.length) + landTimeline(glyphs.length).totalMs + SAFETY_EXTRA_MS;
    const t = window.setTimeout(finish, total);
    return () => window.clearTimeout(t);
  }, [reduced, panelSeen, glyphs.length, finish]);

  const target = useCallback((i: number) => stageRef.current?.querySelector(`[data-glyph-slot="${i}"]`) ?? null, []);

  return (
    <div className="rs-lantern-scene" ref={rootRef}>
      <div className="rs-lantern-stage mx-stack" ref={stageRef}>
        <PillarLanterns chart={chart} lit={lit} arrive={reduced ? undefined : lanternArrive()} />
        {!reduced ? (
          <div className="mx-land-layer" aria-hidden="true">
            <GlyphRise glyphs={glyphs} start={panelSeen} veil={false} landOnto={target} onLand={() => setLanding(true)} onDone={finish} />
          </div>
        ) : null}
      </div>
    </div>
  );
}

export function OrbScene({ chart }: { chart: Chart }) {
  const reduced = useReducedMotion();
  const seen = usePanelSeen();
  const lantern = useSyncExternalStore(lanternCue.subscribe, lanternCue.get, () => 'idle' as LanternPhase);
  const [settled, setSettled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!seen) return;
    const t = window.setTimeout(() => setSettled(true), SETTLE_MS);
    return () => window.clearTimeout(t);
  }, [seen]);

  if (seen && (reduced || (settled && lantern !== 'running')) && !open) setOpen(true);

  return (
    <div className="rs-orb-scene">
      <InkBloom active={open} fit="wide" stain={false}>
        <ElementOrbs chart={chart} lit={open} />
      </InkBloom>
    </div>
  );
}

