import type { PipelineReport } from '../ai/pipeline';
import { PRODUCT_KEYS, type ProductKey } from '../rooms/themes';
import { LOCALES, type Locale } from '@/content/locale';

export const EVENT_NAMES = [

  'landing_view',
  'locale_choose',
  'birth_start',
  'birth_done',
  'result_view',

  'continue_view',
  'continue_click',
  'share',

  'room_click',
  'room_view',
  'checkout_open',
  'checkout_agree',

  'checkout_close',
  'pay_start',
  'pay_success',
  'pay_fail',
  'pay_cancel',

  'reading_start',
  'reading_done',
  'reading_error',

  'bundle_view',
  'bundle_click',

  'bundle_page',

  'reunion_view',
  'reunion_step',
  'reunion_ritual',
  'reunion_result',
  'reunion_cta',
  'reunion_card_save',

  'login_nudge',
  'lantern_pitch',

  'home_banner',

  'xmas_view',
  'xmas_start',
  'xmas_result',
  'xmas_cta',

  'xmas_section',

  'quiz_view',
  'quiz_start',
  'quiz_q',
  'quiz_birth',
  'quiz_done',
  'quiz_type',
  'quiz_share',

  'quiz_cta',
  'quiz_section',

  'card_save',
] as const;

export const SERVER_EVENT_NAMES = ['reading_cost', 'pay_confirmed'] as const;

export type EventName = (typeof EVENT_NAMES)[number];
export type ServerEventName = (typeof SERVER_EVENT_NAMES)[number];
export type PropValue = string | number | boolean;

export interface EventRow {
  name: EventName | ServerEventName;
  sid: string | null;
  room: ProductKey | null;
  locale: Locale | null;
  path: string | null;
  utm: Record<string, string> | null;
  props: Record<string, PropValue>;
}

const MAX_PROPS = 8;
const MAX_TEXT = 60;

function short(v: unknown, max: number): string | null {
  return typeof v === 'string' && v.trim() ? v.trim().slice(0, max) : null;
}

function cleanProps(raw: unknown): Record<string, PropValue> {
  const out: Record<string, PropValue> = {};
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return out;
  for (const [k, v] of Object.entries(raw)) {
    if (Object.keys(out).length >= MAX_PROPS) break;
    if (!/^[a-z][a-z0-9_]{0,23}$/.test(k)) continue;
    if (typeof v === 'string') out[k] = v.slice(0, MAX_TEXT);
    else if (typeof v === 'number' && Number.isFinite(v)) out[k] = v;
    else if (typeof v === 'boolean') out[k] = v;
  }
  return out;
}

function cleanUtm(raw: unknown): Record<string, string> | null {
  if (!raw || typeof raw !== 'object') return null;
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(raw)) {
    if (/^utm_(source|medium|campaign|term|content)$/.test(k) && typeof v === 'string' && v) out[k] = v.slice(0, 100);
  }
  return Object.keys(out).length ? out : null;
}

export function cleanEvent(raw: unknown): EventRow | null {
  if (!raw || typeof raw !== 'object') return null;
  const r = raw as Record<string, unknown>;
  const name = r.name;
  if (typeof name !== 'string' || !(EVENT_NAMES as readonly string[]).includes(name)) return null;
  const sid = short(r.sid, 40);
  if (!sid) return null;
  return {
    name: name as EventName,
    sid,
    room: (PRODUCT_KEYS as readonly unknown[]).includes(r.room) ? (r.room as ProductKey) : null,
    locale: (LOCALES as readonly unknown[]).includes(r.locale) ? (r.locale as Locale) : null,
    path: short(r.path, 120),
    utm: cleanUtm(r.utm),
    props: cleanProps(r.props),
  };
}

export const ENTRY_VALUES = ['free_result', 'home', 'direct'] as const;
export type EntryValue = (typeof ENTRY_VALUES)[number];

export function cleanSid(v: unknown): string | null {
  return typeof v === 'string' && /^s_(?:[0-9a-f]{1,38}|nostorage)$/.test(v) ? v : null;
}

export function cleanEntry(v: unknown): EntryValue | null {
  return (ENTRY_VALUES as readonly unknown[]).includes(v) ? (v as EntryValue) : null;
}

export function reportToRow(r: PipelineReport): EventRow {
  const a = r.analysis.usage;
  const w = r.writer?.usage ?? null;
  return {
    name: 'reading_cost',
    sid: null,
    room: r.room,
    locale: r.locale,
    path: null,
    utm: null,
    props: {
      model: r.writer?.model ?? r.analysis.model,
      ok: r.writer?.status === 'completed',

      ...(r.writer?.status === 'completed'
        ? {}
        : {
            status: r.writer?.status ?? 'none',
            ...(r.writer?.upstream ? { upstream: r.writer.upstream } : {}),
            ...(r.writer?.stop ? { stop: r.writer.stop } : {}),
            ...(r.writer?.errors.length ? { errs: r.writer.errors.join(',').slice(0, 60) } : {}),
          }),
      ms: r.totalMs,
      analysis_in: a?.input_tokens ?? 0,
      analysis_out: a?.output_tokens ?? 0,
      writer_in: w?.input_tokens ?? 0,
      writer_out: w?.output_tokens ?? 0,
      chars: r.writer?.characters ?? 0,
    },
  };
}
