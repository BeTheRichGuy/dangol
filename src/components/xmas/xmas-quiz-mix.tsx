'use client';

import type { CSSProperties } from 'react';
import { XMAS_QUIZ } from '@/content/ko/xmas-quiz';
import { QUIZ_AXES, quizAxes, quizType, quizTypeArt } from '@/lib/xmas/quiz';
import './xmas-quiz.css';

const P = XMAS_QUIZ.paid;

const MAX = 6;

export function axisAt(score: number): number {
  return Math.min(94, Math.max(6, ((MAX - score) / (2 * MAX)) * 100));
}

export function XmasQuizMix({ answers }: { answers: string }) {
  const type = quizType(answers);
  const t = XMAS_QUIZ.types[type];
  const axes = quizAxes(answers);
  if (!t) return null;
  return (
    <section className="xq-mix" aria-label={`${P.over} ${t.name}`}>
      <div className="xq__head" style={{ '--xq-art': `url(${quizTypeArt(type)})` } as CSSProperties}>
        <p className="xq__over">{P.over}</p>
        <h2 className="xq__type">
          <span>{t.name}</span>
        </h2>
        <p className="xq__line">{t.line}</p>
      </div>
      <ul className="xq-mix__axes">
        {QUIZ_AXES.map((axis) => {
          const [title, front, back] = P.axes[axis];
          const v = axes[axis];
          return (
            <li key={axis}>
              <p className="xq-mix__title">{title}</p>
              <div className="xq-mix__bar">
                <span className={v > 0 ? 'is-on' : undefined}>{front}</span>
                <i aria-hidden="true">
                  <b style={{ left: `${axisAt(v)}%` }} />
                </i>
                <span className={v < 0 ? 'is-on' : undefined}>{back}</span>
              </div>
            </li>
          );
        })}
      </ul>
      <p className="xq-mix__note">{P.note}</p>
    </section>
  );
}
