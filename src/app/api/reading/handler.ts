import { MAX_BODY_BYTES, parseRoomRequest } from '../../../lib/rooms/prompt';
import { bearerToken } from '../../../lib/account/server';
import { bundleClaimId } from '../../../lib/payments/bundle';
import { parsePicks } from '../../../lib/payments/offers';
import { bundleKey, paidKey, paymentConfig, payLocales, pickKey, verifyReceipt, type PaymentEnv, type Receipt } from '../../../lib/payments/payments';
import { MAX_READINGS_PER_ORDER, REFUNDED_CLAIM } from '../../../lib/payments/claims';
import { UUID_RE, type ReadingJobStore, type Schedule } from '../../../lib/account/reading-jobs';
import { readBodyText } from '../waitlist/handler';
import type { PromptLibrary } from '../../../lib/ai/assemble';
import { readingConfig, type ReadingConfigEnv } from '../../../lib/ai/config';
import { runReading, type PipelineReport, type ReadingEvent } from '../../../lib/ai/pipeline';
import type { RoomPayload } from '../../../lib/rooms/payload';
import type { ReadingProvider } from '../../../lib/ai/provider';
import { geminiProvider } from '../../../lib/ai/providers/gemini';

export type { ReadingEvent } from '../../../lib/ai/pipeline';

export const RECEIPT_HEADER = 'x-dangol-receipt';

export interface ReadingEnv extends PaymentEnv, ReadingConfigEnv {

  GEMINI_API_KEY?: string;
  DANGOL_READINGS_OPEN?: string;
  NODE_ENV?: string;

  DANGOL_FIRST_PRICE?: string;

  DANGOL_BUNDLES?: string;
}

const NO_STORE = { 'Cache-Control': 'no-store' } as const;

function json(body: Record<string, unknown>, status: number): Response {
  return Response.json(body, { status, headers: NO_STORE });
}

export function receiptCovers(receipt: Receipt, payload: RoomPayload): boolean {

  if ((payload.edition === 'xmas') !== (receipt.room === 'xmas')) return false;
  if (receipt.room === 'pick') {
    const picks = parsePicks(receipt.picks);
    return picks !== null && picks.includes(payload.room) && receipt.key === pickKey(payload, picks);
  }

  if (payload.room === 'reunion') return receipt.room === 'reunion' && receipt.key === paidKey(payload);
  if (receipt.room === 'bundle') return receipt.key === bundleKey(payload);

  if (receipt.room === 'xmas') return payload.room === 'love' && receipt.key === paidKey(payload);
  return receipt.room === payload.room && receipt.key === paidKey(payload);
}

const FLUSH_MS = 4000;

async function patchWithRetry(jobs: ReadingJobStore, jobId: string, token: string, patch: Parameters<ReadingJobStore['patch']>[2], sleep: (ms: number) => Promise<void>): Promise<void> {
  for (let i = 0; i < 4; i += 1) {
    if (await jobs.patch(jobId, token, patch)) return;
    await sleep(500 * (i + 1));
  }
}

export async function writeJob(
  events: AsyncIterable<ReadingEvent>,
  jobs: ReadingJobStore,
  jobId: string,
  token: string,
  opts: { now?: () => number; sleep?: (ms: number) => Promise<void>; flushMs?: number } = {},
): Promise<void> {
  const now = opts.now ?? Date.now;
  const sleep = opts.sleep ?? ((ms: number) => new Promise<void>((done) => setTimeout(done, ms)));
  const flushMs = opts.flushMs ?? FLUSH_MS;
  let text = '';
  let flushedLen = 0;
  let lastFlush = now();
  let ended = false;
  let code = 'api';
  try {
    for await (const ev of events) {
      if (ev.t === 'text') {
        text += ev.v;
        if (now() - lastFlush >= flushMs && text.length > flushedLen) {
          lastFlush = now();
          flushedLen = text.length;
          await jobs.patch(jobId, token, { body: text });
        }
      } else if (ev.t === 'end') {
        ended = ev.stop === 'end_turn';
      } else if (ev.t === 'error') {
        code = ev.code;
        ended = false;
        break;
      }
    }
  } catch {
    ended = false;
    code = 'api';
  }
  if (ended && text.trim()) await patchWithRetry(jobs, jobId, token, { status: 'done', body: text }, sleep);
  else await patchWithRetry(jobs, jobId, token, { status: 'error', error: code, body: null }, sleep);
}

export function isReadingOpen(env: ReadingEnv): boolean {
  if (!env.GEMINI_API_KEY?.trim()) return false;

  const mode = paymentConfig(env).mode;
  if (mode === 'broken') return false;
  if (env.NODE_ENV === 'development') return true;

  return env.DANGOL_READINGS_OPEN === '1' && (mode === 'paddle' || mode === 'toss' || mode === 'dodo');
}

export function handleReadingStatus(env: ReadingEnv): Response {
  const cfg = paymentConfig(env);
  const mode = cfg.mode;
  const pay = mode === 'test' || mode === 'paddle' || mode === 'toss' || mode === 'dodo' || mode === 'skip' ? mode : 'off';

  const dodoOn = cfg.mode === 'dodo' || (cfg.mode === 'toss' && cfg.dodo !== undefined);
  return json({ open: isReadingOpen(env), pay, ...(dodoOn ? { payLocales: payLocales(cfg) } : {}) }, 200);
}

export async function handleReadingPost(
  request: Request,
  deps: {
    env: ReadingEnv;

    prompts: () => PromptLibrary;

    provider?: ReadingProvider;

    verifyUser?: (token: string) => Promise<string | null>;
    now?: () => number;

    report?: (report: PipelineReport) => void;

    claim?: (order: string) => Promise<number | null>;

    jobs?: ReadingJobStore;

    schedule?: Schedule;
  },
): Promise<Response> {
  if (!isReadingOpen(deps.env)) return json({ error: 'not_open' }, 503);
  let uid: string | null = null;

  const token = bearerToken(request);
  if (deps.verifyUser && token) {
    uid = await deps.verifyUser(token);
    if (!uid) return json({ error: 'login_required' }, 401);
  }

  const contentType = request.headers.get('content-type') ?? '';
  if (!contentType.toLowerCase().includes('application/json')) {
    return json({ error: 'unsupported_media_type' }, 415);
  }
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
  const parsed = parseRoomRequest(body);
  if (!parsed.ok) return json({ error: parsed.error }, 400);

  const pay = paymentConfig(deps.env);
  if (pay.mode === 'test' || pay.mode === 'paddle' || pay.mode === 'toss' || pay.mode === 'dodo') {
    const receipt = await verifyReceipt(request.headers.get(RECEIPT_HEADER), pay.secret, (deps.now ?? Date.now)());
    const ok = receipt !== null && receiptCovers(receipt, parsed.payload) && receipt.uid === uid;
    if (!ok) return json({ error: 'payment_required' }, 402);

    const n = deps.claim ? await deps.claim(receipt.room === 'bundle' || receipt.room === 'pick' ? bundleClaimId(receipt.order, parsed.payload.room) : receipt.order) : null;
    if (n === REFUNDED_CLAIM) return json({ error: 'payment_required', code: 'refunded' }, 402);
    if (n !== null && n > MAX_READINGS_PER_ORDER) return json({ error: 'too_many_readings' }, 429);
  }

  const raw = body as Record<string, unknown>;
  const jobId = typeof raw.jobId === 'string' ? raw.jobId : null;
  if (jobId !== null && (!UUID_RE.test(jobId) || !deps.jobs || !deps.schedule || !uid || !token)) {
    return json({ error: UUID_RE.test(jobId) ? 'background_unavailable' : 'invalid_body' }, UUID_RE.test(jobId) ? 503 : 400);
  }

  const events = runReading({
    payload: parsed.payload,
    prompts: deps.prompts(),
    provider: deps.provider ?? geminiProvider((deps.env.GEMINI_API_KEY ?? '').trim()),
    config: readingConfig(deps.env),

    signal: jobId === null ? request.signal : new AbortController().signal,
    report: deps.report,
  });

  if (jobId !== null && deps.jobs && deps.schedule && token) {
    const jobs = deps.jobs;
    if (!(await jobs.begin(jobId, token, { room: parsed.payload.room, locale: parsed.payload.locale }))) return json({ error: 'job_rejected' }, 409);
    deps.schedule(() => writeJob(events, jobs, jobId, token, { now: deps.now }));
    return json({ job: jobId }, 202);
  }

  const encoder = new TextEncoder();
  const out = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        for await (const event of events) controller.enqueue(encoder.encode(`${JSON.stringify(event)}\n`));
      } catch {
        controller.enqueue(encoder.encode(`${JSON.stringify({ t: 'error', code: 'api' } satisfies ReadingEvent)}\n`));
      } finally {
        controller.close();
      }
    },
  });
  return new Response(out, {
    status: 200,
    headers: { ...NO_STORE, 'Content-Type': 'application/x-ndjson; charset=utf-8', 'X-Accel-Buffering': 'no' },
  });
}
