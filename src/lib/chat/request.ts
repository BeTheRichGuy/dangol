import { isLocale, type Locale } from '@/content/locale';
import { cleanQuestion, parseRoomRequest } from '@/lib/rooms/request';
import type { RoomPayload } from '@/lib/rooms/payload';
import { CHAT_CHARACTERS, HISTORY_MAX, isChatKey, type ChatKey, type ChatLine } from './characters';

export interface ChatRequest {
  who: ChatKey;
  locale: Locale;
  payload: RoomPayload;

  lines: ChatLine[];
}

export type ParsedChatRequest = { ok: true; request: ChatRequest } | { ok: false };

const CONTROL = /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g;

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

function parseLines(raw: unknown): ChatLine[] | null {
  if (!Array.isArray(raw) || raw.length === 0 || raw.length > 60) return null;
  const out: ChatLine[] = [];
  for (const v of raw) {
    if (!isRecord(v) || typeof v.text !== 'string') return null;
    if (v.role !== 'reader' && v.role !== 'character') return null;

    const text = v.role === 'reader' ? cleanQuestion(v.text) : v.text.replace(CONTROL, '').trim().slice(0, 600);
    if (!text) continue;
    out.push({ role: v.role, text });
  }
  const lines = out.slice(-HISTORY_MAX);
  return lines.length > 0 && lines[lines.length - 1].role === 'reader' ? lines : null;
}

export function parseChatRequest(body: unknown): ParsedChatRequest {
  if (!isRecord(body) || !isChatKey(body.who) || !isLocale(body.locale)) return { ok: false };
  const parsed = parseRoomRequest(body.payload);
  if (!parsed.ok) return { ok: false };
  const { payload } = parsed;

  if (payload.room !== CHAT_CHARACTERS[body.who].room || payload.locale !== body.locale) return { ok: false };
  const lines = parseLines(body.messages);
  if (!lines) return { ok: false };
  return { ok: true, request: { who: body.who, locale: body.locale, payload: { ...payload, question: '' }, lines } };
}
