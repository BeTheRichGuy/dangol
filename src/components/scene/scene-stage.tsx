'use client';

import Image from 'next/image';
import { useCallback, useEffect, useRef, useState, type CSSProperties } from 'react';
import { UI } from '@/content/ui';
import { useReducedMotion } from '../use-reduced-motion';
import { REACTION_IDS, REACTION_RELEASE_MS, SCENE_IDS, type ReactionId, type SceneId } from './manifest';
import { canonicalScene, reactionVideo, resolveScene, type SceneMedia } from './resolve';
import { useVideoAllowed } from './use-video-allowed';

export interface SceneReaction {
  id: ReactionId;

  key: number;

  delayMs?: number;

  release?: boolean;
}

const CLIP_FADE_OUT_MS = 300;

const MEDIA = Object.fromEntries(SCENE_IDS.map((id) => [id, resolveScene(id)])) as Record<SceneId, SceneMedia>;

const DRIFT: Record<SceneId, { x: string; y: string }> = {
  listen: { x: '1.2%', y: '-0.8%' },
};

const CROSSFADE_MS = 450;

type Status = 'active' | 'prev' | 'hidden';

function SceneLayer({
  id,
  status,
  videoAllowed,
  reduced,
  first,
}: {
  id: SceneId;
  status: Status;
  videoAllowed: boolean;
  reduced: boolean;

  first: boolean;
}) {
  const media = MEDIA[id];
  const [stillIdx, setStillIdx] = useState(0);
  const [videoIdx, setVideoIdx] = useState(0);
  const [playing, setPlaying] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const still = media.stills[Math.min(stillIdx, media.stills.length - 1)];
  const videoSrc = videoAllowed ? media.videos[videoIdx] : undefined;

  const drift = !reduced && videoIdx >= media.videos.length;

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    if (status === 'active') {

      if (v.paused && v.currentTime > 0) v.currentTime = 0;
      v.play().catch(() => {

      });
    } else if (status === 'hidden') {
      v.pause();
    }
  }, [status, videoSrc]);

  const framing = still.framing;
  const dir = DRIFT[id];

  return (
    <div className="dg-scene" data-status={status} aria-hidden={status !== 'active'}>
      <div
        className="absolute inset-0"
        style={{
          transform: framing.zoom !== 1 ? `scale(${framing.zoom})` : undefined,
          transformOrigin: '50% 0',
        }}
      >
        <div
          className={`absolute inset-0 ${drift ? 'dg-drift' : ''}`}
          style={{ '--drift-x': dir.x, '--drift-y': dir.y } as CSSProperties}
        >
          <Image
            src={still.src}
            alt={status === 'active' ? UI.reading.sceneAlt[id] : ''}
            fill
            sizes="(min-width: 520px) 480px, 100vw"
            loading={first ? undefined : 'eager'}
            preload={first}
            style={{ objectFit: 'cover', objectPosition: framing.position }}
            onError={() => setStillIdx((i) => i + 1)}
          />
        </div>
        {videoSrc ? (
          <video
            ref={videoRef}
            className="absolute inset-0 h-full w-full"
            style={{
              objectFit: 'cover',
              objectPosition: media.videoFraming.position,
              opacity: playing ? 1 : 0,
              transition: 'opacity 400ms ease',
            }}
            src={videoSrc}
            muted
            loop
            playsInline
            preload="auto"
            disablePictureInPicture
            disableRemotePlayback
            aria-hidden="true"
            tabIndex={-1}
            onPlaying={() => setPlaying(true)}
            onError={() => {
              setPlaying(false);
              setVideoIdx((i) => i + 1);
            }}
          />
        ) : null}
      </div>
    </div>
  );
}

function ReactionPlayer({
  src,
  trigger,
  onEnd,
}: {
  src: string;
  trigger: SceneReaction | null;
  onEnd: (key: number) => void;
}) {
  const ref = useRef<HTMLVideoElement>(null);
  const [shown, setShown] = useState(false);

  const activeKey = useRef<number | null>(null);
  const onEndRef = useRef(onEnd);
  const key = trigger?.key ?? null;
  const delayMs = trigger?.delayMs ?? 0;
  const release = trigger?.release === true;

  const delayRef = useRef(delayMs);

  useEffect(() => {
    onEndRef.current = onEnd;
    delayRef.current = delayMs;
  });

  const finish = useCallback((k: number) => {
    if (activeKey.current !== k) return;
    activeKey.current = null;
    setShown(false);
    window.setTimeout(() => {

      if (activeKey.current === null) ref.current?.pause();
      onEndRef.current(k);
    }, CLIP_FADE_OUT_MS + 20);
  }, []);

  useEffect(() => {
    const v = ref.current;
    if (!v || key === null) return;
    let safety = 0;
    const start = () => {
      activeKey.current = key;
      v.currentTime = 0;
      v.play()
        .then(() => {
          if (activeKey.current === key) setShown(true);
        })
        .catch(() => {

          finish(key);
        });

      safety = window.setTimeout(() => finish(key), 8000);
    };
    const delay = delayRef.current;
    const wait = delay > 0 ? window.setTimeout(start, delay) : 0;
    if (delay <= 0) start();
    return () => {
      window.clearTimeout(wait);
      window.clearTimeout(safety);
    };
  }, [key, finish]);

  useEffect(() => {
    if (key === null || !release) return;
    const t = window.setTimeout(() => finish(key), REACTION_RELEASE_MS);
    return () => window.clearTimeout(t);
  }, [key, release, finish]);

  useEffect(() => {
    if (key !== null) return;
    const k = activeKey.current;
    if (k === null) return;
    const t = window.setTimeout(() => finish(k), 0);
    return () => window.clearTimeout(t);
  }, [key, finish]);

  return (
    <video
      ref={ref}
      className="absolute inset-0 h-full w-full"
      style={{
        objectFit: 'cover',
        objectPosition: '50% 18%',
        opacity: shown ? 1 : 0,
        transition: `opacity ${shown ? 200 : CLIP_FADE_OUT_MS}ms ease`,
        zIndex: 3,
      }}
      src={src}
      muted
      playsInline
      preload="auto"
      disablePictureInPicture
      disableRemotePlayback
      aria-hidden="true"
      tabIndex={-1}
      onPlaying={() => {
        if (activeKey.current !== null) setShown(true);
      }}
      onEnded={() => {
        const k = activeKey.current;
        if (k !== null) finish(k);
      }}
      onError={() => {
        const k = activeKey.current;
        if (k !== null) finish(k);
      }}
    />
  );
}

export function SceneStage({
  scene: sceneProp,
  prefetch: prefetchProp,
  reaction,
  onReactionEnd,
  priority = false,
}: {
  scene: SceneId;

  prefetch?: SceneId | null;
  reaction?: SceneReaction | null;

  onReactionEnd?: (key: number) => void;

  priority?: boolean;
}) {

  const scene = canonicalScene(sceneProp);
  const prefetch = prefetchProp ? canonicalScene(prefetchProp) : null;
  const reduced = useReducedMotion();
  const videoAllowed = useVideoAllowed();

  const [state, setState] = useState(() => ({
    scene,
    prev: null as SceneId | null,
    mounted: Array.from(new Set<SceneId>([scene, ...(prefetch ? [prefetch] : [])])),
    initial: scene,
  }));
  const needsPrefetch = prefetch != null && !state.mounted.includes(prefetch);
  if (state.scene !== scene || needsPrefetch) {
    setState({
      ...state,
      scene,
      prev: state.scene !== scene ? state.scene : state.prev,
      mounted: Array.from(new Set<SceneId>([...state.mounted, scene, ...(prefetch ? [prefetch] : [])])),
    });
  }

  const prev = state.prev;
  useEffect(() => {
    if (!prev) return;
    const t = window.setTimeout(
      () => setState((s) => (s.prev === prev ? { ...s, prev: null } : s)),
      reduced ? 200 : CROSSFADE_MS + 60,
    );
    return () => window.clearTimeout(t);
  }, [prev, reduced]);

  const [finishedKey, setFinishedKey] = useState<number | null>(null);
  const activeReaction = reaction && finishedKey !== reaction.key ? reaction : null;

  return (
    <div className="absolute inset-0 isolate overflow-hidden">
      {state.mounted.map((id) => (
        <SceneLayer
          key={id}
          id={id}
          status={id === state.scene ? 'active' : id === state.prev ? 'prev' : 'hidden'}
          videoAllowed={videoAllowed}
          reduced={reduced}
          first={priority && id === state.initial}
        />
      ))}
      {videoAllowed
        ? REACTION_IDS.map((id) => {
            const src = reactionVideo(id);
            if (!src) return null;
            return (
              <ReactionPlayer
                key={id}
                src={src}
                trigger={activeReaction?.id === id ? activeReaction : null}
                onEnd={(k) => {
                  setFinishedKey(k);
                  onReactionEnd?.(k);
                }}
              />
            );
          })
        : null}
    </div>
  );
}
