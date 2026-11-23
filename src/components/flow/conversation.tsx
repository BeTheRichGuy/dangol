'use client';

import { useEffect, useRef, useState, type Dispatch, type ReactNode, type SetStateAction } from 'react';
import type { SceneId } from '../scene/manifest';
import { reactionClip } from '../scene/reaction';
import { canonicalScene, reactionVideo } from '../scene/resolve';
import { useVideoAllowed } from '../scene/use-video-allowed';
import { useReducedMotion } from '../use-reduced-motion';
import type { Answers } from './answers';
import { ChatLog, ChatSkeleton, type ChatMsg, type ChatState } from './chat-log';
import { FlowFrame } from './flow-shell';
import type { TalkStepDef, Turn } from './script';

const seen = new Set<string>();

type Stage = 'gap' | 'dots' | 'typing' | 'done';

interface Beat {
  id: string;
  kind: 'reaction' | 'question';
  text: string;

  gapMs: number;

  dotsMs: number;

  instant: boolean;
}

interface Run {
  key: string;
  beats: Beat[];

  i: number;
  stage: Stage;

  skipped: boolean;
}

const seenKey = (b: Pick<Beat, 'id' | 'text'>) => `${b.id}|${b.text}`;

export function listenPauseMs(reaction: string): number {
  return Math.round(Math.min(2400, Math.max(1100, 500 + 28 * reaction.length)));
}

const QUESTION_DOTS_MS = 380;

const CLIP_HOLD_MAX_MS = 3000;

function dotsFor(text: string): number {
  return Math.round(Math.min(900, Math.max(500, 440 + text.length * 5)));
}

function stageAt(b: Beat): Stage {
  return b.gapMs > 0 ? 'gap' : b.dotsMs > 0 ? 'dots' : 'typing';
}

function advance(r: Run): Run {
  if (r.stage === 'gap') return { ...r, stage: r.beats[r.i].dotsMs > 0 ? 'dots' : 'typing' };
  if (r.stage === 'dots') return { ...r, stage: 'typing' };
  if (r.stage === 'typing') {
    const ni = r.i + 1;
    if (ni >= r.beats.length) return { ...r, stage: 'done' };
    return { ...r, i: ni, stage: stageAt(r.beats[ni]) };
  }
  return r;
}

function makeBeats(def: TalkStepDef, turn: Turn | null, quick: boolean, firstOfAll: boolean): Beat[] {
  const beats: Beat[] = [];
  let reactionSeen = false;
  if (turn && turn.reaction && !quick) {
    const reaction: Beat = {
      id: `r:${turn.from}`,
      kind: 'reaction',
      text: turn.reaction,
      gapMs: 180,
      dotsMs: dotsFor(turn.reaction),
      instant: false,
    };
    reactionSeen = seen.has(seenKey(reaction));
    beats.push(reaction);
  }
  const hasReaction = beats.length > 0;
  beats.push({
    id: `q:${def.id}`,
    kind: 'question',
    text: def.question,

    gapMs: turn ? (hasReaction ? (reactionSeen ? 300 : listenPauseMs(turn.reaction ?? '')) : 120) : 0,
    dotsMs: quick ? 0 : turn ? (hasReaction ? QUESTION_DOTS_MS : 500) : firstOfAll ? 600 : 0,
    instant: false,
  });
  return beats.map((b) => (seen.has(seenKey(b)) ? { ...b, gapMs: 0, dotsMs: 0, instant: true } : b));
}

function emptyRun(key: string): Run {
  return { key, beats: [], i: 0, stage: 'done', skipped: true };
}

export interface ConversationProps {

  steps: readonly TalkStepDef[];

  stepId: string;
  answers: Answers;

  turn: Turn | null;

  pace?: 'chat' | 'quick';

  loading?: boolean;

  loadingScene?: SceneId;
  progress?: { index: number; total: number };
  onBack?: () => void;

  dense?: boolean;

  body?: ReactNode;

  overlay?: (info: { scene: SceneId; atQuestion: boolean; ready: boolean }) => ReactNode;
}

export function Conversation({
  steps,
  stepId,
  answers,
  turn,
  pace = 'chat',
  loading = false,
  loadingScene = 'listen',
  progress,
  onBack,
  dense,
  body,
  overlay,
}: ConversationProps) {
  const reduced = useReducedMotion();
  const videoAllowed = useVideoAllowed();
  const idx = steps.findIndex((s) => s.id === stepId);
  const def: TalkStepDef | undefined = steps[idx];
  const live = !loading && def !== undefined;
  const turnActive = live && turn !== null && turn.to === stepId;
  const activeTurn = turnActive ? turn : null;
  const runKey = live ? `${stepId}:${activeTurn ? activeTurn.id : 0}` : 'loading';

  function startRun(): Run {
    if (!live || !def) return emptyRun(runKey);
    const beats = makeBeats(def, activeTurn, pace === 'quick', idx === 0 && activeTurn === null);

    if (reduced || beats.every((b) => b.instant)) {
      return { key: runKey, beats, i: beats.length - 1, stage: 'done', skipped: true };
    }
    return { key: runKey, beats, i: 0, stage: stageAt(beats[0]), skipped: false };
  }

  const [run, setRun] = useState<Run>(startRun);

  if (run.key !== runKey) setRun(startRun());

  const fromDef = activeTurn ? steps.find((s) => s.id === activeTurn.from) : undefined;
  const hasReaction = run.beats[0]?.kind === 'reaction';
  const clipPlayable = hasReaction && !run.skipped && videoAllowed && !!fromDef?.clip && reactionVideo(fromDef.clip) !== null;

  const sceneChanges = !!fromDef && !!def && canonicalScene(fromDef.scene) !== canonicalScene(def.scene);
  const [clipDoneKey, setClipDoneKey] = useState<number | null>(null);
  const clipHold = clipPlayable && sceneChanges && activeTurn !== null && clipDoneKey !== activeTurn.id;

  useStageTimer(run, setRun, clipHold);

  const skip = () => {
    if (!live) return;
    for (const b of run.beats) seen.add(seenKey(b));
    setRun((r) => (r.stage === 'done' ? r : { ...r, i: r.beats.length - 1, stage: 'done', skipped: true }));
  };

  const messages: ChatMsg[] = [];
  if (live && def) {
    for (let s = 0; s < idx; s += 1) {
      const sd = steps[s];
      messages.push({ id: `q:${sd.id}`, who: 'yul', text: sd.question, state: 'full' });
      const answerText = sd.answer(answers);

      if (answerText) {
        messages.push({ id: `a:${sd.id}`, who: 'me', text: answerText, state: 'full', fresh: activeTurn?.from === sd.id && !reduced });
      }

      if (!(activeTurn && sd.id === activeTurn.from)) {
        const reactionText = sd.reaction?.(answers);
        if (reactionText) messages.push({ id: `r:${sd.id}`, who: 'yul', text: reactionText, state: 'full' });
      }
    }
    run.beats.forEach((b, j) => {
      let state: ChatState | null;
      if (run.stage === 'done' || j < run.i) state = 'full';
      else if (j > run.i || run.stage === 'gap') state = null;
      else state = run.stage === 'dots' ? 'typing' : 'typed';
      if (state === null) return;
      messages.push({
        id: b.id,
        who: 'yul',
        text: b.text,
        state,
        instant: b.instant || run.skipped,

        fresh: !b.instant && !run.skipped && !reduced,
        pace: b.kind === 'reaction' ? 'slow' : undefined,
        onTyped:
          state === 'typed'
            ? () => {
                seen.add(seenKey(b));
                setRun((r) => (r.key === run.key && r.i === j && r.stage === 'typing' ? advance(r) : r));
              }
            : undefined,
      });
    });
  }

  const lastBeat = run.beats.length - 1;
  const atQuestion = run.stage === 'done' || (run.i >= lastBeat && run.stage !== 'gap');
  const scene: SceneId = def ? (fromDef && !atQuestion ? fromDef.scene : def.scene) : loadingScene;

  const reactionBeat = run.beats[0]?.kind === 'reaction' ? run.beats[0] : null;
  const clip = reactionClip({
    hasReaction,
    skipped: run.skipped,
    beat: run.i,
    stage: run.stage,
    dotsMs: reactionBeat?.dotsMs ?? 0,
  });
  const reaction =
    activeTurn && clip.on && fromDef?.clip
      ? { id: fromDef.clip, key: activeTurn.id, delayMs: clip.delayMs, release: clip.release }
      : null;
  const prefetch = def ? (steps[idx + 1]?.scene ?? null) : null;
  const ready = live && run.stage === 'done';
  const compact = def?.compact === true && scene === def.scene;

  return (
    <FlowFrame
      scene={scene}
      prefetch={prefetch}
      reaction={reaction}
      onReactionEnd={setClipDoneKey}
      progress={live ? progress : undefined}
      onBack={live ? onBack : undefined}
      log={live ? <ChatLog messages={messages} visible={compact ? 1 : 3} /> : <ChatSkeleton />}
      overlay={live && overlay ? overlay({ scene, atQuestion, ready }) : null}
      body={live ? body : null}
      stepKey={stepId}
      tray={def?.tray === true}
      dense={dense}
      ready={ready}
      onTap={live && !ready ? skip : undefined}
    />
  );
}

function useStageTimer(run: Run, setRun: Dispatch<SetStateAction<Run>>, hold: boolean) {
  const { stage, i, key } = run;
  const beat = run.beats[i];
  const ms = stage === 'gap' ? beat?.gapMs : stage === 'dots' ? beat?.dotsMs : undefined;
  const holding = hold && stage === 'gap' && beat?.kind === 'question';
  const startedAt = useRef(0);

  useEffect(() => {
    startedAt.current = performance.now();
  }, [key, i, stage]);

  useEffect(() => {
    if (ms === undefined) return;
    const elapsed = performance.now() - startedAt.current;
    const total = holding ? Math.max(ms, CLIP_HOLD_MAX_MS) : ms;
    const t = window.setTimeout(
      () => {
        setRun((r) => (r.key === key && r.i === i && r.stage === stage ? advance(r) : r));
      },
      Math.max(0, total - elapsed),
    );
    return () => window.clearTimeout(t);
  }, [ms, stage, i, key, holding, setRun]);
}
