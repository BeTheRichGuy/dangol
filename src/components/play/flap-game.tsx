'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { CHAT } from '@/content/chat';
import { ROOMS_COPY } from '@/content/rooms';
import { PLAYER_X, WORLD_H, createFlap, step, type Flap, type FlapEvent } from '@/lib/chat/flap';
import { SCORE_CUTS, gaugeOf, tokensForScore } from '@/lib/chat/tokens';
import { addTokens, getBest, saveBest, setServerBalance } from '@/lib/chat/wallet';
import { useLanterns } from '../chat/use-lanterns';
import { useLocale } from '../locale-provider';
import { drawScene, makeSprites, type Dust, type Sprites } from './pixel-art';
import { LanternIcon } from './play-icons';
import { createSfx, type Sfx } from './flap-sound';
import './play.css';

const STEP_S = 1 / 120;
type Phase = 'ready' | 'running' | 'over';

interface Over {
  score: number;

  lanterns: number;
  record: boolean;
  cause: 'hit' | 'fall';
}

interface Layout {

  scale: number;

  w: number;
  cssW: number;
  cssH: number;
}

function layoutOf(el: HTMLElement): Layout {
  const dpr = window.devicePixelRatio || 1;
  const dev = Math.floor(el.clientWidth * dpr);
  const scale = Math.max(2, Math.floor(dev / 190));
  const w = Math.max(160, Math.floor(dev / scale));
  return { scale, w, cssW: (w * scale) / dpr, cssH: (WORLD_H * scale) / dpr };
}

export function FlapGame({ receipt = null, keeper }: { receipt?: string | null; keeper?: string }) {
  useLocale();
  const T = CHAT.play;
  const wallet = useLanterns();
  const rewards = wallet.open === true && wallet.mode !== null && !wallet.needLogin;

  const [phase, setPhase] = useState<Phase>('ready');
  const [score, setScore] = useState(0);
  const [total, setTotal] = useState(0);
  const [best, setBest] = useState(() => (typeof window === 'undefined' ? 0 : getBest()));
  const [over, setOver] = useState<Over | null>(null);
  const [sound, setSound] = useState(true);
  const [pop, setPop] = useState<{ id: number; text: string } | null>(null);
  const [size, setSize] = useState<Pick<Layout, 'cssW' | 'cssH'> | null>(null);

  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sfx = useRef<Sfx | null>(null);
  const soundRef = useRef(sound);
  const rewardsRef = useRef(rewards);
  const walletRef = useRef(wallet);
  const receiptRef = useRef(receipt);
  const popId = useRef(0);

  const game = useRef<{
    run: Flap;
    phase: Phase;
    flap: boolean;
    total: number;
    banked: number;
    dust: Dust[];
    layout: Layout | null;
  }>({
    run: createFlap(1, 228),
    phase: 'ready',
    flap: false,
    total: 0,
    banked: 0,
    dust: [],
    layout: null,
  });

  const bestRef = useRef(best);

  const bestAtStart = useRef(best);

  useEffect(() => {
    soundRef.current = sound;
    rewardsRef.current = rewards;
    walletRef.current = wallet;
    receiptRef.current = receipt;
  }, [sound, rewards, wallet, receipt]);

  const start = useCallback(() => {
    const g = game.current;
    g.run = createFlap(Math.floor(Math.random() * 2 ** 31), g.layout?.w ?? 228);
    g.phase = 'running';

    g.flap = true;
    bestAtStart.current = bestRef.current;
    g.dust = [];
    setScore(0);
    setOver(null);
    setPhase('running');
    sfx.current?.close();
    sfx.current = soundRef.current ? createSfx() : null;
  }, []);

  const tap = useCallback(() => {
    const g = game.current;
    if (g.phase === 'ready') start();
    else if (g.phase === 'running') g.flap = true;
  }, [start]);

  useEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap) return;
    const apply = () => {
      const l = layoutOf(wrap);
      game.current.layout = l;
      game.current.run.w = l.w;
      setSize({ cssW: l.cssW, cssH: l.cssH });
    };
    apply();
    const ro = new ResizeObserver(apply);
    ro.observe(wrap);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    const sprites: Sprites = makeSprites();
    const world = document.createElement('canvas');
    let raf = 0;
    let last = performance.now();
    let acc = 0;
    let clock = 0;

    const showGain = (n: number) => {
      popId.current += 1;
      setPop({ id: popId.current, text: T.tokenGain(n) });
    };

    const bank = async (gain: number, lit: number) => {
      const w = walletRef.current;
      if (w.mode === 'local') {
        addTokens(gain);
        showGain(gain);
        return;
      }
      try {
        const token = await w.token();
        if (!token) return;
        const res = await fetch('/api/lantern', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}`, ...(receiptRef.current ? { 'X-Dangol-Receipt': receiptRef.current } : {}) },
          body: JSON.stringify({ lit }),
        });
        if (!res.ok) return;
        const v = (await res.json()) as { granted?: unknown; balance?: unknown };
        if (typeof v.balance === 'number') setServerBalance(v.balance);
        if (typeof v.granted === 'number' && v.granted > 0) showGain(v.granted);
      } catch {

      }
    };

    const handle = (events: FlapEvent[], run: Flap) => {
      const g = game.current;
      for (const ev of events) {
        if (ev === 'flap') {
          sfx.current?.flap();

          for (let i = 0; i < 4; i += 1) {
            g.dust.push({ x: PLAYER_X - 10 + i * 6, y: run.y + 9, vx: -16 - i * 3, vy: 8 + i * 4, life: 0, max: 0.4 });
          }
        } else if (ev === 'bell') {
          sfx.current?.bell();
          setScore(run.score);
          g.total += 1;
          setTotal(g.total);
          if (run.score > bestRef.current) {
            bestRef.current = run.score;
            saveBest(run.score);
            setBest(run.score);
          }
          const lit = tokensForScore(g.total);
          if (lit > g.banked) {
            const gain = lit - g.banked;
            g.banked = lit;
            sfx.current?.lantern();
            navigator.vibrate?.(16);
            if (rewardsRef.current) void bank(gain, lit);
          }
        } else if (ev === 'hit') {
          sfx.current?.hit();
          navigator.vibrate?.(30);
        } else if (ev === 'fall') {
          sfx.current?.fall();
          navigator.vibrate?.(30);
        }
      }
    };

    const frame = (now: number) => {
      const g = game.current;
      const l = g.layout;
      const canvas = canvasRef.current;

      const dt = Math.max(0, Math.min(0.05, (now - last) / 1000));
      last = now;
      clock += dt;
      if (l && canvas) {
        if (g.phase !== 'ready') {
          acc += dt;
          while (acc >= STEP_S) {
            handle(step(g.run, STEP_S, g.flap), g.run);
            g.flap = false;
            acc -= STEP_S;
          }
          if (g.phase === 'running' && !g.run.alive && g.run.deadT > 0.9 && g.run.cause) {
            g.phase = 'over';
            setPhase('over');
            setOver({
              score: g.run.score,
              lanterns: tokensForScore(g.total),
              record: g.run.score > 0 && g.run.score > bestAtStart.current,
              cause: g.run.cause,
            });
          }
        }
        for (const d of g.dust) {
          d.life += dt;
          d.x += d.vx * dt;
          d.y += d.vy * dt;
        }
        g.dust = g.dust.filter((d) => d.life < d.max);

        if (canvas.width !== l.w * l.scale) {
          canvas.width = l.w * l.scale;
          canvas.height = WORLD_H * l.scale;
        }
        world.width = l.w;
        world.height = WORLD_H;
        const wctx = world.getContext('2d');
        const cctx = canvas.getContext('2d');
        if (wctx && cctx) {
          drawScene(wctx, sprites, g.run, clock, g.dust, g.phase !== 'ready');
          cctx.imageSmoothingEnabled = false;
          cctx.drawImage(world, 0, 0, canvas.width, canvas.height);
        }
      }
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => {
      cancelAnimationFrame(raf);
      sfx.current?.close();
      sfx.current = null;
    };
  }, [T]);

  const toggleSound = () => {
    const next = !sound;
    setSound(next);
    if (!next) {
      sfx.current?.close();
      sfx.current = null;
    } else if (game.current.phase === 'running') sfx.current = createSfx();
  };

  const gauge = gaugeOf(total);
  const E = T.embedded;
  const writer = keeper ?? ROOMS_COPY.keepers.yul.name;

  return (
    <section className="sg-embed" aria-labelledby="fl-title" data-testid="sogeum-flap">
      <p className="rm-eyebrow m-0">{E.eyebrow}</p>
      <h2 id="fl-title" className="sg-card__title">
        {E.title(writer)}
      </h2>
      <p className="sg-card__lead">{E.note(writer)}</p>

      <div ref={wrapRef} className="fl-wrap">
        <div
          className="fl-stage"
          style={size ? { width: size.cssW, height: size.cssH } : undefined}
          role="button"
          tabIndex={0}
          aria-label={T.hint}
          data-phase={phase}
          onPointerDown={(e) => {
            e.preventDefault();
            tap();
          }}
          onKeyDown={(e) => {
            if (e.key === ' ' || e.key === 'Enter' || e.key === 'ArrowUp') {
              e.preventDefault();
              if (!e.repeat) tap();
            }
          }}
        >
          <canvas ref={canvasRef} className="fl-canvas" aria-hidden="true" />
          {phase !== 'over' ? (
            <span className="fl-score" aria-live="off">
              {T.score(score)}
            </span>
          ) : null}
          {best > 0 && phase !== 'over' ? <span className="fl-best">{T.best(best)}</span> : null}
          {phase === 'ready' ? <span className="fl-start">{T.start}</span> : null}
          {pop ? (
            <span key={pop.id} className="fl-pop" onAnimationEnd={() => setPop((p) => (p?.id === pop.id ? null : p))}>
              <LanternIcon />
              {pop.text}
            </span>
          ) : null}
          {phase === 'over' && over ? (
            <div className="fl-over" role="status" data-testid="flap-over">
              <strong>{T.over[over.cause].title}</strong>
              <span>{T.over[over.cause].body}</span>
              <span className="fl-over__score">
                {T.score(over.score)} · {T.earned(over.lanterns)}
              </span>
              {over.record ? <span className="fl-over__record">{T.newBest}</span> : null}
              {over.lanterns >= SCORE_CUTS.length ? <span>{T.allLit}</span> : null}
              <button
                type="button"
                className="dg-btn dg-btn--glass"
                onPointerDown={(e) => e.stopPropagation()}
                onClick={start}
              >
                {T.again}
              </button>
            </div>
          ) : null}
        </div>
      </div>

      <div className="sg-lamps" role="group" aria-label={T.gaugeLabel(gauge.tokens)}>
        <span className="sg-lamps__label">{T.gauge}</span>
        {SCORE_CUTS.map((cut, i) => {
          const fill = i < gauge.tokens ? 1 : i === gauge.tokens ? gauge.fill : 0;
          return (
            <span key={cut} className="sg-lamp" data-lit={fill >= 1 || undefined}>
              <LanternIcon lit={fill} />
            </span>
          );
        })}
      </div>
      <p className="fl-how">{T.total(total)}</p>
      <p className="fl-how">{T.how}</p>

      <div className="sg-foot">
        {rewards ? <p className="sg-foot__note">{E.rewardNote}</p> : wallet.needLogin ? <p className="sg-foot__note">{E.loginNote}</p> : <span />}
        <button type="button" className="sg-sound" aria-pressed={sound} onClick={toggleSound}>
          {sound ? T.sound.on : T.sound.off}
        </button>
      </div>
    </section>
  );
}
