'use client';

import { useRef } from 'react';
import { UI } from '@/content/ui';

export const MIN_BIRTH_YEAR = 1930;

export interface DateParts {
  month: string;
  day: string;
  year: string;
}

export function datePartsFrom(iso: string | null): DateParts {
  if (!iso) return { month: '', day: '', year: '' };
  const [y, m, d] = iso.split('-');
  return { month: String(Number(m)), day: String(Number(d)), year: y };
}

export type DateParse =
  | { ok: true; iso: string }
  | { ok: false; error: 'incomplete' | 'invalid' | 'range'; min: number; max: number };

export function parseDateParts(p: DateParts): DateParse {
  const max = new Date().getFullYear();
  const min = MIN_BIRTH_YEAR;
  if (!p.month || !p.day || p.year.length < 4) return { ok: false, error: 'incomplete', min, max };
  const m = Number(p.month);
  const d = Number(p.day);
  const y = Number(p.year);
  if (!Number.isInteger(m) || !Number.isInteger(d) || !Number.isInteger(y)) {
    return { ok: false, error: 'invalid', min, max };
  }
  if (y < min || y > max) return { ok: false, error: 'range', min, max };
  const probe = new Date(Date.UTC(y, m - 1, d));
  if (probe.getUTCFullYear() !== y || probe.getUTCMonth() !== m - 1 || probe.getUTCDate() !== d) {
    return { ok: false, error: 'invalid', min, max };
  }

  if (probe.getTime() > Date.now()) return { ok: false, error: 'range', min, max };
  const pad = (n: number, w = 2) => String(n).padStart(w, '0');
  return { ok: true, iso: `${pad(y, 4)}-${pad(m)}-${pad(d)}` };
}

function digits(value: string, max: number): string {
  return value.replace(/\D/g, '').slice(0, max);
}

export function DateField({
  value,
  onChange,
  invalid,
  describedBy,
}: {
  value: DateParts;
  onChange: (next: DateParts) => void;
  invalid?: boolean;
  describedBy?: string;
}) {
  const t = UI.reading.steps.date;
  const yearRef = useRef<HTMLInputElement>(null);
  return (
    <fieldset className="m-0 border-0 p-0">
      <legend className="sr-only">{t.group}</legend>
      <div className="grid grid-cols-[1.55fr_0.8fr_1fr] gap-2">
        <div>
          <label htmlFor="dob-month" className="dg-label">
            {t.month}
          </label>
          <select
            id="dob-month"
            name="bday-month"
            autoComplete="bday-month"
            className="dg-field dg-select"
            value={value.month}
            aria-invalid={invalid || undefined}
            aria-describedby={describedBy}
            onChange={(e) => onChange({ ...value, month: e.target.value })}
          >
            <option value="" disabled>
              {t.monthPlaceholder}
            </option>
            {UI.months.map((name, i) => (
              <option key={name} value={String(i + 1)}>
                {name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="dob-day" className="dg-label">
            {t.day}
          </label>
          <input
            id="dob-day"
            name="bday-day"
            className="dg-field text-center"
            inputMode="numeric"
            autoComplete="bday-day"
            placeholder={t.dayPlaceholder}
            maxLength={2}
            value={value.day}
            aria-invalid={invalid || undefined}
            aria-describedby={describedBy}
            onChange={(e) => {
              const day = digits(e.target.value, 2);
              onChange({ ...value, day });
              if (day.length === 2) yearRef.current?.focus();
            }}
          />
        </div>
        <div>
          <label htmlFor="dob-year" className="dg-label">
            {t.year}
          </label>
          <input
            id="dob-year"
            name="bday-year"
            ref={yearRef}
            className="dg-field text-center"
            inputMode="numeric"
            autoComplete="bday-year"
            placeholder={t.yearPlaceholder}
            maxLength={4}
            value={value.year}
            aria-invalid={invalid || undefined}
            aria-describedby={describedBy}
            onChange={(e) => onChange({ ...value, year: digits(e.target.value, 4) })}
          />
        </div>
      </div>
    </fieldset>
  );
}

export interface TimeParts {
  hour: string;
  minute: string;
  period: 'am' | 'pm' | '';
}

export function timePartsFrom(hhmm: string | null): TimeParts {
  if (!hhmm) return { hour: '', minute: '', period: '' };
  const [h, m] = hhmm.split(':').map(Number);
  const period = h >= 12 ? 'pm' : 'am';
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return { hour: String(h12), minute: String(m).padStart(2, '0'), period };
}

export type TimeParse = { ok: true; hhmm: string } | { ok: false; error: 'invalid' | 'period' };

export function parseTimeParts(p: TimeParts): TimeParse {
  const h = Number(p.hour);
  const m = Number(p.minute === '' ? '0' : p.minute);
  if (!p.hour || !Number.isInteger(h) || h < 1 || h > 12 || !Number.isInteger(m) || m < 0 || m > 59) {
    return { ok: false, error: 'invalid' };
  }
  if (!p.period) return { ok: false, error: 'period' };
  const h24 = (h % 12) + (p.period === 'pm' ? 12 : 0);
  return { ok: true, hhmm: `${String(h24).padStart(2, '0')}:${String(m).padStart(2, '0')}` };
}

export function TimeField({
  value,
  onChange,
  invalid,
  describedBy,
}: {
  value: TimeParts;
  onChange: (next: TimeParts) => void;
  invalid?: boolean;
  describedBy?: string;
}) {
  const t = UI.reading.steps.time;
  const minuteRef = useRef<HTMLInputElement>(null);
  return (
    <fieldset className="m-0 border-0 p-0">
      <legend className="sr-only">{t.group}</legend>
      <div className="flex items-end gap-2">
        <div className="min-w-0 flex-1">
          <label htmlFor="tob-hour" className="dg-label">
            {t.hour}
          </label>
          <input
            id="tob-hour"
            className="dg-field text-center"
            inputMode="numeric"
            placeholder={t.hourPlaceholder}
            maxLength={2}
            value={value.hour}
            aria-invalid={invalid || undefined}
            aria-describedby={describedBy}
            onChange={(e) => {
              const hour = digits(e.target.value, 2);
              onChange({ ...value, hour });
              if (hour.length === 2 || (hour.length === 1 && Number(hour) > 1)) minuteRef.current?.focus();
            }}
          />
        </div>
        <span aria-hidden="true" className="pb-3.5 font-display text-2xl text-ink-soft">
          :
        </span>
        <div className="min-w-0 flex-1">
          <label htmlFor="tob-minute" className="dg-label">
            {t.minute}
          </label>
          <input
            id="tob-minute"
            ref={minuteRef}
            className="dg-field text-center"
            inputMode="numeric"
            placeholder={t.minutePlaceholder}
            maxLength={2}
            value={value.minute}
            aria-invalid={invalid || undefined}
            aria-describedby={describedBy}
            onChange={(e) => onChange({ ...value, minute: digits(e.target.value, 2) })}
          />
        </div>
        <div className="shrink-0">
          <div role="radiogroup" aria-label={t.period} className="dg-seg">
            {(['am', 'pm'] as const).map((p) => (
              <button
                key={p}
                type="button"
                role="radio"
                aria-checked={value.period === p}
                onClick={() => onChange({ ...value, period: p })}
              >
                {p === 'am' ? t.am : t.pm}
              </button>
            ))}
          </div>
        </div>
      </div>
    </fieldset>
  );
}

export function FieldError({ id, children }: { id: string; children: React.ReactNode }) {
  return (
    <p id={id} role="alert" className="dg-error">
      {children}
    </p>
  );
}
