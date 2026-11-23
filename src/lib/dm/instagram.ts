import { createHmac, timingSafeEqual } from 'node:crypto';
import type { DmAccount, DmConfig } from './config';

export function verifySignature(secret: string, rawBody: string, header: string | null): boolean {
  const m = /^sha256=([0-9a-f]{64})$/i.exec(header ?? '');
  if (!m) return false;
  const expected = createHmac('sha256', secret).update(rawBody).digest();
  return timingSafeEqual(expected, Buffer.from(m[1], 'hex'));
}

export interface CommentEvent {

  accountId: string;
  commentId: string;

  fromId: string;
  mediaId: string;
  text: string;

  isReply: boolean;
}

const MAX_EVENTS = 50;

const str = (v: unknown): string => (typeof v === 'string' ? v : '');
const obj = (v: unknown): Record<string, unknown> => (v && typeof v === 'object' ? (v as Record<string, unknown>) : {});

export function parseCommentEvents(body: unknown): CommentEvent[] {
  const root = obj(body);
  if (root.object !== 'instagram' || !Array.isArray(root.entry)) return [];
  const out: CommentEvent[] = [];
  for (const entry of root.entry) {
    const e = obj(entry);
    const accountId = str(e.id);
    if (!accountId || !Array.isArray(e.changes)) continue;
    for (const change of e.changes) {
      const c = obj(change);
      if (c.field !== 'comments') continue;
      const v = obj(c.value);

      const commentId = str(v.id) || str(v.comment_id);
      const fromId = str(obj(v.from).id);
      const mediaId = str(obj(v.media).id);
      if (!commentId || !fromId || !mediaId) continue;
      out.push({ accountId, commentId, fromId, mediaId, text: str(v.text), isReply: str(v.parent_id) !== '' });
      if (out.length >= MAX_EVENTS) return out;
    }
  }
  return out;
}

export type SendOutcome = { ok: true } | { ok: false; kind: 'transient' | 'auth' | 'permanent' };

const TRANSIENT_CODES = new Set([1, 2, 4, 17, 32, 341, 613]);
const AUTH_CODES = new Set([10, 102, 190, 200]);

export async function sendPrivateReply(args: {
  cfg: DmConfig;
  account: DmAccount;
  commentId: string;
  message: Record<string, unknown>;
  fetcher?: typeof fetch;
}): Promise<SendOutcome> {
  const { cfg, account, commentId, message } = args;
  const doFetch = args.fetcher ?? fetch;
  let res: Response;
  try {
    res = await doFetch(`${cfg.graphBase}/${cfg.apiVersion}/${account.id}/messages`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${account.token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ recipient: { comment_id: commentId }, message }),
      cache: 'no-store',
      signal: AbortSignal.timeout(8000),
    });
  } catch {
    return { ok: false, kind: 'transient' };
  }
  if (res.ok) return { ok: true };
  const payload: unknown = await res.json().catch(() => null);
  const code = Number(obj(obj(payload).error).code);
  if (res.status === 401 || res.status === 403 || AUTH_CODES.has(code)) return { ok: false, kind: 'auth' };
  if (res.status === 429 || res.status >= 500 || TRANSIENT_CODES.has(code)) return { ok: false, kind: 'transient' };
  return { ok: false, kind: 'permanent' };
}

const captionCache = new Map<string, string>();

export async function fetchCaption(args: {
  cfg: DmConfig;
  account: DmAccount;
  mediaId: string;
  fetcher?: typeof fetch;
}): Promise<string | null> {
  const { cfg, account, mediaId } = args;
  const cached = captionCache.get(mediaId);
  if (cached !== undefined) return cached || null;
  const doFetch = args.fetcher ?? fetch;
  try {
    const res = await doFetch(`${cfg.graphBase}/${cfg.apiVersion}/${encodeURIComponent(mediaId)}?fields=caption`, {
      headers: { Authorization: `Bearer ${account.token}` },
      cache: 'no-store',
      signal: AbortSignal.timeout(4000),
    });
    if (!res.ok) return null;
    const caption = str(obj(await res.json().catch(() => null)).caption);
    if (captionCache.size >= 200) captionCache.clear();
    captionCache.set(mediaId, caption);
    return caption || null;
  } catch {
    return null;
  }
}
