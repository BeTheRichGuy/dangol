'use client';

import { useId } from 'react';
import { ACCOUNT } from '@/content/account';
import { QUESTION_LIMIT } from '@/lib/rooms/request';
import '../account/account.css';

export function ConcernBox({ value, onChange, disabled }: { value: string; onChange: (v: string) => void; disabled: boolean }) {
  const uid = useId();
  const T = ACCOUNT.picker;
  return (
    <section aria-labelledby={`${uid}-q`} className="rm-section rm-concern">
      <div className="ac-pick__q">
        <label htmlFor={`${uid}-ta`} id={`${uid}-q`} className="ac-pick__legend">
          {T.question} <span className="ac-pick__opt">{T.questionOptional}</span>
        </label>
        <textarea
          id={`${uid}-ta`}
          className="ac-pick__textarea"
          rows={3}
          maxLength={QUESTION_LIMIT}
          placeholder={T.questionPlaceholder}
          value={value}
          disabled={disabled}
          onChange={(e) => onChange(e.target.value)}
        />
      </div>
    </section>
  );
}
