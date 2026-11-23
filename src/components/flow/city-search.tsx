'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { UI } from '@/content/ui';
import { hasLocalScript, searchLocalCities, type CityRecord } from '@/lib/places/local-cities';
import { useLocale } from '../locale-provider';
import { useFocusWhenReady } from './flow-context';
import type { PlaceChoice } from './answers';

let citiesPromise: Promise<CityRecord[]> | null = null;

function loadCities(): Promise<CityRecord[]> {
  citiesPromise ??= import('city-timezones').then((mod) => {
    const holder = mod as unknown as { cityMapping?: CityRecord[]; default?: { cityMapping?: CityRecord[] } };
    return holder.cityMapping ?? holder.default?.cityMapping ?? [];
  });
  return citiesPromise;
}

function fold(s: string): string {
  return s
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .trim();
}

interface Match {
  record: CityRecord;
  label: string;
}

const MAX_RESULTS = 8;

function countryName(iso2: string, locale: string): string {
  try {
    return new Intl.DisplayNames([locale], { type: 'region' }).of(iso2) ?? iso2;
  } catch {
    return iso2;
  }
}

export function searchCities(all: CityRecord[], query: string, locale = 'en'): Match[] {
  if (hasLocalScript(query)) {
    return searchLocalCities(all, query, locale, MAX_RESULTS).map(({ record, name }) => ({
      record,
      label: `${name}, ${countryName(record.iso2, locale)}`,
    }));
  }
  const [namePart, ...rest] = query.split(',');
  const needle = fold(namePart);
  const countryNeedle = fold(rest.join(','));
  if (needle.length < 2) return [];

  const hits: CityRecord[] = [];
  for (const c of all) {
    const a = fold(c.city_ascii || c.city);
    const b = fold(c.city);
    if (!(a.startsWith(needle) || b.startsWith(needle))) continue;
    if (countryNeedle) {
      const iso = c.iso2.toLowerCase();
      const country = fold(c.country);
      if (!(iso === countryNeedle || country.startsWith(countryNeedle))) continue;
    }
    hits.push(c);
  }

  hits.sort((x, y) => {
    const xe = fold(x.city_ascii || x.city) === needle ? 1 : 0;
    const ye = fold(y.city_ascii || y.city) === needle ? 1 : 0;
    if (xe !== ye) return ye - xe;
    return y.pop - x.pop;
  });

  const top = hits.slice(0, MAX_RESULTS);
  const baseLabel = (c: CityRecord) => `${c.city_ascii || c.city}, ${c.iso2}`;
  const counts = new Map<string, number>();
  for (const c of top) counts.set(baseLabel(c), (counts.get(baseLabel(c)) ?? 0) + 1);

  return top.map((record) => {
    const base = baseLabel(record);

    const label =
      (counts.get(base) ?? 0) > 1 && record.province
        ? `${record.city_ascii || record.city}, ${record.province}, ${record.iso2}`
        : base;
    return { record, label };
  });
}

export function toPlaceChoice(m: Match): PlaceChoice {
  return {
    name: m.record.city_ascii || m.record.city,
    country: m.record.iso2,
    lat: m.record.lat,
    lng: m.record.lng,
    tz: m.record.timezone,
    label: m.label,
  };
}

export function CitySearch({
  initial,
  onSelect,
  onClear,
  autoFocus,
  label,
  optional,
}: {
  initial: PlaceChoice | null;
  onSelect: (place: PlaceChoice) => void;

  onClear?: () => void;
  autoFocus?: boolean;

  label?: string;

  optional?: string;
}) {
  const t = UI.reading.steps.place;
  const locale = useLocale();
  const uid = useId();
  const listId = `${uid}-list`;
  const [query, setQuery] = useState(initial?.label ?? '');
  const [cities, setCities] = useState<CityRecord[] | null>(null);
  const [failed, setFailed] = useState(false);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const chosenLabel = useRef<string | null>(initial?.label ?? null);

  useFocusWhenReady(inputRef, autoFocus ?? false);

  useEffect(() => {
    let alive = true;
    loadCities()
      .then((all) => {
        if (alive) setCities(all);
      })
      .catch(() => {
        if (alive) setFailed(true);
      });
    return () => {
      alive = false;
    };
  }, []);

  const typed = query.trim().length >= (hasLocalScript(query) ? 1 : 2) && query !== initial?.label;
  const results = cities && typed ? searchCities(cities, query, locale) : [];
  const showList = open && typed;
  const activeIndex = Math.min(active, Math.max(results.length - 1, 0));

  function choose(m: Match) {
    setQuery(m.label);
    setOpen(false);
    chosenLabel.current = m.label;
    onSelect(toPlaceChoice(m));
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setOpen(true);
      setActive((i) => Math.min(i + 1, Math.max(results.length - 1, 0)));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter') {
      if (showList && results[activeIndex]) {
        e.preventDefault();
        choose(results[activeIndex]);
      }
    } else if (e.key === 'Escape') {
      setOpen(false);
    }
  }

  const loading = typed && !cities && !failed;
  const empty = showList && cities && results.length === 0;

  return (
    <div>
      <label htmlFor={`${uid}-input`} className="dg-label">
        {label ?? t.label}
        {optional ? <span className="rf-optional"> {optional}</span> : null}
      </label>
      <input
        id={`${uid}-input`}
        ref={inputRef}
        className="dg-field"
        type="text"
        role="combobox"
        aria-expanded={showList && results.length > 0}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-activedescendant={showList && results[activeIndex] ? `${uid}-opt-${activeIndex}` : undefined}
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="words"
        spellCheck={false}
        enterKeyHint="go"
        placeholder={t.placeholder}
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          if (chosenLabel.current !== null && e.target.value !== chosenLabel.current) {
            chosenLabel.current = null;
            onClear?.();
          }
          setOpen(true);
          setActive(0);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        onKeyDown={onKeyDown}
      />
      <p className="mt-2 text-[0.8125rem] font-medium text-ink-soft">{t.hint}</p>

      <p className="sr-only" role="status">
        {showList && results.length > 0 ? t.results(results.length) : ''}
      </p>

      {loading ? <p className="mt-2 text-sm text-ink-soft">{t.loading}</p> : null}
      {failed ? <p className="dg-error">{UI.reading.errors.cityPick}</p> : null}

      {showList && results.length > 0 ? (
        <ul
          id={listId}
          role="listbox"
          aria-label={t.suggestions}
          className="dg-city-list max-h-[min(34dvh,236px)] overflow-y-auto overscroll-contain"
        >
          {results.map((m, i) => (
            <li
              key={`${m.label}-${m.record.lat}-${m.record.lng}`}
              id={`${uid}-opt-${i}`}
              role="option"
              aria-selected={i === activeIndex}

              onMouseDown={(e) => {
                e.preventDefault();
                choose(m);
              }}
              onTouchStart={() => setActive(i)}
              className={`flex min-h-12 cursor-pointer items-center px-3.5 text-[1.0625rem] font-medium text-ink ${
                i === activeIndex ? 'bg-paper' : ''
              }`}
            >
              {m.label}
            </li>
          ))}
        </ul>
      ) : null}

      {empty ? (
        <p className="dg-error" role="status">
          {t.none}
        </p>
      ) : null}
    </div>
  );
}
