import type { Focus } from '@/lib/reading/types';
import type { TypeKey } from '@/lib/saju/types';
import { UTM_KEYS, type Utm, type WaitlistInput } from './types';

const TYPE_KEY_SET: Record<TypeKey, true> = {
  pine: true, vine: true, sun: true, candle: true, mountain: true,
  field: true, blade: true, jewel: true, ocean: true, rain: true,
};
const FOCUS_SET: Record<Focus, true> = { love: true, someone: true, everything: true };

const EMAIL_MAX = 254;
const LOCAL_MAX = 64;

const LOCAL_RE = /^[a-z0-9.!#$%&'*+/=?^_`{|}~-]+$/;
const LABEL_RE = /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/;
const TLD_RE = /^(?:[a-z]{2,63}|xn--[a-z0-9-]{1,59})$/;

const SOURCE_RE = /^[a-z0-9][a-z0-9_.:-]{0,39}$/i;
const UTM_VALUE_MAX = 100;
const CONTROL_CHARS = /[\u0000-\u001f\u007f]/g;

export function normalizeEmail(raw: string): string {
  return raw.trim().toLowerCase();
}

export function isValidEmail(email: string): boolean {
  if (email.length === 0 || email.length > EMAIL_MAX) return false;
  const at = email.lastIndexOf('@');
  if (at < 1 || at !== email.indexOf('@')) return false;
  const local = email.slice(0, at);
  const domain = email.slice(at + 1);
  if (local.length > LOCAL_MAX || !LOCAL_RE.test(local)) return false;
  if (local.startsWith('.') || local.endsWith('.') || local.includes('..')) return false;
  const labels = domain.split('.');
  if (labels.length < 2) return false;
  if (!labels.every((label) => LABEL_RE.test(label))) return false;
  return TLD_RE.test(labels[labels.length - 1]);
}

export type ParseResult =
  | { ok: true; value: WaitlistInput }
  | { ok: false; error: 'invalid_email' | 'consent_required' | 'invalid_body' };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function cleanSource(raw: unknown): string {
  return typeof raw === 'string' && SOURCE_RE.test(raw.trim()) ? raw.trim().toLowerCase() : 'unknown';
}

function cleanUtm(raw: unknown): Utm | undefined {
  if (!isRecord(raw)) return undefined;
  const out: Utm = {};
  for (const key of UTM_KEYS) {
    const value = raw[key];
    if (typeof value !== 'string') continue;
    const cleaned = value.replace(CONTROL_CHARS, '').trim().slice(0, UTM_VALUE_MAX);
    if (cleaned) out[key] = cleaned;
  }
  return Object.keys(out).length > 0 ? out : undefined;
}

export function parseWaitlistInput(body: unknown): ParseResult {
  if (!isRecord(body)) return { ok: false, error: 'invalid_body' };
  if (typeof body.email !== 'string') return { ok: false, error: 'invalid_email' };
  const email = normalizeEmail(body.email);
  if (!isValidEmail(email)) return { ok: false, error: 'invalid_email' };
  if (body.consent !== true) return { ok: false, error: 'consent_required' };

  const type =
    typeof body.type === 'string' && Object.hasOwn(TYPE_KEY_SET, body.type) ? (body.type as TypeKey) : undefined;
  const focus =
    typeof body.focus === 'string' && Object.hasOwn(FOCUS_SET, body.focus) ? (body.focus as Focus) : undefined;

  return {
    ok: true,
    value: {
      email,
      consent: true,
      source: cleanSource(body.source),
      type,
      focus,
      utm: cleanUtm(body.utm),
    },
  };
}
