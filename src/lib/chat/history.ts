'use client';

import { CHAT_KEYS, MESSAGE_MAX, type ChatKey, type ChatLine } from './characters';

const keyOf = (who: ChatKey, scope: string) => (scope ? `dangol.chat.${who}.${scope}.v1` : `dangol.chat.${who}.v1`);

export const SAVED_MAX = 60;

function clean(raw: unknown): ChatLine[] {
  if (!Array.isArray(raw)) return [];
  const out: ChatLine[] = [];
  for (const v of raw) {
    if (!v || typeof v !== 'object') continue;
    const { role, text } = v as Record<string, unknown>;
    if ((role !== 'reader' && role !== 'character') || typeof text !== 'string' || !text.trim()) continue;
    out.push({ role, text: text.slice(0, MESSAGE_MAX * 3) });
  }
  return out.slice(-SAVED_MAX);
}

export function loadHistory(who: ChatKey, scope = ''): ChatLine[] {
  try {
    return clean(JSON.parse(window.localStorage.getItem(keyOf(who, scope)) ?? '[]'));
  } catch {
    return [];
  }
}

export function saveHistory(who: ChatKey, lines: readonly ChatLine[], scope = '') {
  try {
    window.localStorage.setItem(keyOf(who, scope), JSON.stringify(lines.slice(-SAVED_MAX)));
  } catch {

  }
}

export function clearHistory(who: ChatKey, scope = '') {
  try {
    window.localStorage.removeItem(keyOf(who, scope));
  } catch {

  }
}

export function lastLines(scope = ''): Record<ChatKey, ChatLine | null> {
  const out = {} as Record<ChatKey, ChatLine | null>;
  for (const k of CHAT_KEYS) out[k] = loadHistory(k, scope).at(-1) ?? null;
  return out;
}
