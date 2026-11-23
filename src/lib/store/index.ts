import { createFileAdapter } from './file-store';
import { createUpstashAdapterFromEnv } from './upstash-store';
import {
  WaitlistError,
  type WaitlistAdapter,
  type WaitlistDraft,
  type WaitlistInput,
} from './types';
import { isValidEmail, normalizeEmail } from './validate';

let adapter: WaitlistAdapter | null = null;

function getAdapter(): WaitlistAdapter {
  if (adapter) return adapter;
  const remote = createUpstashAdapterFromEnv();
  if (remote) {
    adapter = remote;
    return adapter;
  }

  if (process.env.VERCEL) throw new WaitlistError('not_open');
  adapter = createFileAdapter();
  return adapter;
}

export function isWaitlistOpen(env: Record<string, string | undefined> = process.env): boolean {
  if (adapter) return true;
  if (createUpstashAdapterFromEnv(env)) return true;
  return !env.VERCEL;
}

export function setWaitlistAdapter(next: WaitlistAdapter | null): void {
  adapter = next;
}

export async function addToWaitlist(
  input: WaitlistInput,
  options: { now?: Date } = {},
): Promise<{ regularNo: number }> {
  if (input.consent !== true) throw new WaitlistError('consent_required');
  const email = normalizeEmail(input.email);
  if (!isValidEmail(email)) throw new WaitlistError('invalid_email');

  const draft: WaitlistDraft = {
    email,
    createdAt: (options.now ?? new Date()).toISOString(),
    consent: true,
    source: input.source ?? 'unknown',
    ...(input.type ? { type: input.type } : {}),
    ...(input.focus ? { focus: input.focus } : {}),
    ...(input.utm && Object.keys(input.utm).length > 0 ? { utm: input.utm } : {}),
  };

  const { regularNo } = await getAdapter().addOrGet(draft);
  return { regularNo };
}

export { createFileAdapter } from './file-store';
export { createUpstashAdapter, createUpstashAdapterFromEnv, regularNoForOrdinal } from './upstash-store';
export type { UpstashAdapterOptions } from './upstash-store';
export { isValidEmail, normalizeEmail, parseWaitlistInput } from './validate';
export type { ParseResult } from './validate';
export { WaitlistError, UTM_KEYS } from './types';
export type {
  Utm,
  UtmKey,
  WaitlistAdapter,
  WaitlistDraft,
  WaitlistEntry,
  WaitlistErrorCode,
  WaitlistInput,
  WaitlistResult,
} from './types';
