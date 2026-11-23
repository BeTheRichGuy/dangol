'use client';

import { useMemo } from 'react';
import { XMAS_FLOW } from '@/content/xmas';
import { useLocale } from '../locale-provider';
import { buildRoomPayload } from '@/lib/rooms/payload';
import { useAnswers } from '../flow/answers';
import { buildResultModel } from '../result/result-data';
import { fillName, splitChapters } from '../rooms/reading-blocks';
import '../result/result.css';
import '../rooms/rooms.css';
import { XmasReading } from './xmas-paid';
import { XMAS_SAMPLE_KO } from './xmas-sample';
import { loadXmasQuiz, parseXmasInput, useHydrated, useXmasRaw } from './xmas-store';
import { parseQuizAnswers } from '@/lib/xmas/quiz';
import { computeChart } from '@/lib/saju/engine';

const D = XMAS_FLOW.read;

const RAW_KEY = 'dangol.xmas.sampleRaw';
function rawOverride(): string | null {
  try {
    return sessionStorage.getItem(RAW_KEY);
  } catch {
    return null;
  }
}

export function XmasRead() {
  const locale = useLocale();
  const hydrated = useHydrated();
  const answers = useAnswers();
  const xmasRaw = useXmasRaw();
  const name = answers.name.trim();
  const parts = useMemo(() => splitChapters(fillName((hydrated && rawOverride()) || XMAS_SAMPLE_KO, name), false), [name, hydrated]);

  const payload = useMemo(() => {
    const model = hydrated ? buildResultModel(answers) : null;
    if (!model || !answers.sex) return null;
    const x = parseXmasInput(xmasRaw) ?? { relation: { stage: 'talking' as const, goal: 'meet' as const, contact: null }, partner: null };
    try {
      const partner = x.partner ? { chart: computeChart({ date: x.partner.date, time: x.partner.time, place: model.chart.input.place, sex: null }), kind: 'crush' as const } : null;

      const quiz = parseQuizAnswers(loadXmasQuiz());
      return buildRoomPayload({ room: 'love', locale, chart: model.chart, nowIso: model.nowIso, edition: 'xmas', xmas: x.relation, partner, ...(quiz ? { quiz } : {}) });
    } catch {
      return null;
    }
  }, [hydrated, answers, xmasRaw, locale]);

  if (!hydrated) return <main className="sd-page xm" lang={locale} />;

  return (
    <main className="sd-page xm" lang={locale}>
      <p className="xq-notice">
        <b>{D.badge}</b> {D.notice}
      </p>
      <XmasReading parts={parts} payload={payload} name={name} sex={answers.sex} />
    </main>
  );
}
