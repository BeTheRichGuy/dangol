import { MAX_BODY_BYTES } from '../../../lib/rooms/prompt';
import { bearerToken } from '../../../lib/account/server';
import { readBodyText } from '../waitlist/handler';
import type { PromptLibrary } from '../../../lib/ai/assemble';
import { readingConfig, type ReadingConfigEnv } from '../../../lib/ai/config';
import type { ReadingProvider } from '../../../lib/ai/provider';
import { geminiProvider } from '../../../lib/ai/providers/gemini';
import type { Lanterns } from '../../../lib/chat/lanterns';
import { assembleChat, chatMessage, parseReply } from '../../../lib/chat/prompt';
import { parseChatRequest } from '../../../lib/chat/request';
import { CHAT_COST } from '../../../lib/chat/tokens';
import { ledgerConfig } from '../../../lib/payments/ledger';

export interface ChatEnv extends ReadingConfigEnv {
  GEMINI_API_KEY?: string;
  DANGOL_CHAT_OPEN?: string;
  NODE_ENV?: string;

  LEDGER_SECRET?: string;
  NEXT_PUBLIC_SUPABASE_URL?: string;
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?: string;
  NEXT_PUBLIC_SUPABASE_ANON_KEY?: string;
}

const NO_STORE = { 'Cache-Control': 'no-store' } as const;

const REPLY_TIMEOUT_MS = 60_000;

const MAX_TOKENS = 4096;

function json(body: Record<string, unknown>, status: number): Response {
  return Response.json(body, { status, headers: NO_STORE });
}

export function isChatOpen(env: ChatEnv): boolean {
  if (!env.GEMINI_API_KEY?.trim()) return false;
  if (env.NODE_ENV === 'development') return true;

  return env.DANGOL_CHAT_OPEN === '1' && ledgerConfig({ ...env }) !== null;
}

export function handleChatStatus(env: ChatEnv, lanterns?: Lanterns): Response {
  return json({ open: isChatOpen(env), wallet: lanterns ? 'server' : 'local' }, 200);
}

export async function handleChatPost(
  request: Request,
  deps: {
    env: ChatEnv;
    prompts: () => PromptLibrary;

    provider?: ReadingProvider;

    lanterns?: Lanterns;

    verifyUser?: (token: string) => Promise<string | null>;
  },
): Promise<Response> {
  if (!isChatOpen(deps.env)) return json({ error: 'not_open' }, 503);

  const contentType = request.headers.get('content-type') ?? '';
  if (!contentType.toLowerCase().includes('application/json')) return json({ error: 'unsupported_media_type' }, 415);
  const declared = Number(request.headers.get('content-length'));
  if (Number.isFinite(declared) && declared > MAX_BODY_BYTES) return json({ error: 'payload_too_large' }, 413);

  let text: string | null;
  try {
    text = await readBodyText(request, MAX_BODY_BYTES);
  } catch {
    return json({ error: 'invalid_json' }, 400);
  }
  if (text === null) return json({ error: 'payload_too_large' }, 413);

  let body: unknown;
  try {
    body = JSON.parse(text);
  } catch {
    return json({ error: 'invalid_json' }, 400);
  }
  const parsed = parseChatRequest(body);
  if (!parsed.ok) return json({ error: 'invalid_body' }, 400);
  const { who, locale, payload, lines } = parsed.request;

  let uid: string | null = null;
  let balance: number | null = null;
  if (deps.lanterns) {
    const token = bearerToken(request);
    uid = deps.verifyUser && token ? await deps.verifyUser(token) : null;
    if (!uid) return json({ error: 'login_required' }, 401);
    const left = await deps.lanterns.spend(uid, CHAT_COST);
    if (left === 'short') return json({ error: 'no_lantern' }, 402);
    if (left === null) return json({ error: 'api' }, 502);
    balance = left;
  }

  const fail = async (error: 'busy' | 'refusal' | 'api', status: number): Promise<Response> => {
    if (deps.lanterns && uid) balance = (await deps.lanterns.give(uid, CHAT_COST)) ?? balance;
    return json({ error, ...(balance !== null ? { balance } : {}) }, status);
  };

  const config = readingConfig(deps.env);
  const provider = deps.provider ?? geminiProvider((deps.env.GEMINI_API_KEY ?? '').trim());
  const signal = AbortSignal.any([request.signal, AbortSignal.timeout(REPLY_TIMEOUT_MS)]);

  let reply = '';
  let failure: 'busy' | 'refusal' | 'api' | null = null;
  try {
    for await (const ev of provider.write({
      system: assembleChat(deps.prompts(), who, locale),
      user: chatMessage(who, payload, lines),
      model: config.writer.model,
      effort: 'low',
      maxTokens: MAX_TOKENS,
      signal,
      refusalFallback: false,
    })) {
      if (ev.t === 'text') reply += ev.v;
      else if (ev.t === 'fail') failure = ev.code === 'busy' ? 'busy' : 'api';
      else if (ev.reason === 'refusal') failure = 'refusal';
      else if (ev.reason !== 'end_turn') failure = 'api';
    }
  } catch {
    failure = 'api';
  }
  if (failure) {
    console.error('[chat] reply failed', failure);
    return fail(failure, failure === 'busy' ? 429 : failure === 'refusal' ? 422 : 502);
  }
  const messages = parseReply(reply);
  if (messages.length === 0) return fail('api', 502);
  return json({ messages, ...(balance !== null ? { balance } : {}) }, 200);
}
