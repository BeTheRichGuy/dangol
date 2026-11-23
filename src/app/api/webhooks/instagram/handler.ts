import { createHash, createHmac, timingSafeEqual } from 'node:crypto';
import { cardMessage, buildDm, textMessage } from '../../../../lib/dm/message';
import { dmConfig, dmVerifyToken, type DmAccount, type DmConfig } from '../../../../lib/dm/config';
import { fetchCaption, parseCommentEvents, sendPrivateReply, verifySignature, type CommentEvent, type SendOutcome } from '../../../../lib/dm/instagram';
import { isXmasPost, matchTalisman, pickTalisman } from '../../../../lib/dm/pick';
import { XMAS_OPEN } from '../../../../lib/xmas/open';
import { xmasOnSale } from '../../../../lib/xmas/season';
import { DmStoreError, makeDmStore, type DmStore } from '../../../../lib/dm/store';
import { readBodyText } from '../../waitlist/handler';

const NO_STORE = { 'Cache-Control': 'no-store' } as const;
const MAX_BYTES = 256 * 1024;

export const HOURLY_CAP = 600;

const SENT_TTL_SEC = 8 * 24 * 3600;
const RATE_TTL_SEC = 2 * 3600;

const json = (body: Record<string, unknown>, status: number) => Response.json(body, { status, headers: NO_STORE });

export interface InstagramWebhookDeps {
  env: Record<string, string | undefined>;
  fetcher?: typeof fetch;
  now?: () => number;

  store?: DmStore | null;

  hourlyCap?: number;
}

const digest = (s: string) => createHash('sha256').update(s).digest();
const safeEqual = (a: string, b: string) => timingSafeEqual(digest(a), digest(b));

export function handleInstagramVerify(request: Request, deps: Pick<InstagramWebhookDeps, 'env'>): Response {
  const expected = dmVerifyToken(deps.env);
  if (!expected) return json({ error: 'not_open' }, 503);
  const q = new URL(request.url).searchParams;
  const given = q.get('hub.verify_token');
  if (q.get('hub.mode') !== 'subscribe' || !given || !safeEqual(given, expected)) return json({ error: 'forbidden' }, 403);
  const challenge = q.get('hub.challenge') ?? '';

  if (!/^\d{1,20}$/.test(challenge)) return json({ error: 'bad_challenge' }, 400);
  return new Response(challenge, { status: 200, headers: { ...NO_STORE, 'Content-Type': 'text/plain; charset=utf-8' } });
}

type Skip = 'self' | 'reply' | 'unknown_account' | 'duplicate' | 'rate_capped';

interface Tally {
  sent: number;
  failed: number;
  authFailed: number;
  transient: number;
  skipped: Partial<Record<Skip, number>>;
}

function sentKey(cfg: DmConfig, account: DmAccount, ev: CommentEvent): string {
  const h = createHmac('sha256', cfg.appSecret).update(`${account.id}|${ev.mediaId}|${ev.fromId}`).digest('hex');
  return `dangol:dm:sent:${h}`;
}

async function handleOne(ev: CommentEvent, cfg: DmConfig, store: DmStore, deps: InstagramWebhookDeps, tally: Tally): Promise<void> {
  const skip = (why: Skip) => {
    tally.skipped[why] = (tally.skipped[why] ?? 0) + 1;
  };
  const account = cfg.accounts.find((a) => a.id === ev.accountId);
  if (!account) return skip('unknown_account');
  if (ev.fromId === account.id) return skip('self');
  if (ev.isReply) return skip('reply');

  const key = sentKey(cfg, account, ev);
  if (!(await store.claim(key, SENT_TTL_SEC))) return skip('duplicate');

  const hour = Math.floor((deps.now ?? Date.now)() / 3_600_000);
  if ((await store.bump(`dangol:dm:rate:${account.lang}:${hour}`, RATE_TTL_SEC)) > (deps.hourlyCap ?? HOURLY_CAP)) {
    await store.release(key).catch(() => undefined);
    return skip('rate_capped');
  }

  let caption: string | null = null;
  if (matchTalisman(ev.text) === null) caption = await fetchCaption({ cfg, account, mediaId: ev.mediaId, fetcher: deps.fetcher });

  const xmas = XMAS_OPEN && xmasOnSale((deps.now ?? Date.now)()) && isXmasPost({ comment: ev.text, caption });
  const dm = buildDm({
    talisman: xmas ? 'love' : pickTalisman({ comment: ev.text, caption }),
    lang: account.lang,
    origin: cfg.origin,
    edition: xmas ? 'xmas' : undefined,
  });

  const send = (message: Record<string, unknown>): Promise<SendOutcome> =>
    sendPrivateReply({ cfg, account, commentId: ev.commentId, message, fetcher: deps.fetcher });
  let outcome = await send(cfg.format === 'card' ? cardMessage(dm) : textMessage(dm));

  if (!outcome.ok && outcome.kind === 'permanent' && cfg.format === 'card') outcome = await send(textMessage(dm));

  if (outcome.ok) {
    tally.sent++;
  } else if (outcome.kind === 'transient') {

    await store.release(key).catch(() => undefined);
    tally.transient++;
  } else {

    tally.failed++;
    if (outcome.kind === 'auth') tally.authFailed++;
  }
}

export async function handleInstagramWebhook(request: Request, deps: InstagramWebhookDeps): Promise<Response> {
  const cfg = dmConfig(deps.env);
  if (!cfg) return json({ error: 'not_open' }, 503);
  const store = deps.store !== undefined ? deps.store : makeDmStore(deps.env, deps.fetcher);
  if (!store) return json({ error: 'not_open' }, 503);

  let text: string | null;
  try {
    text = await readBodyText(request, MAX_BYTES);
  } catch {
    return json({ error: 'invalid_json' }, 400);
  }
  if (text === null) return json({ error: 'payload_too_large' }, 413);
  if (!verifySignature(cfg.appSecret, text, request.headers.get('x-hub-signature-256'))) return json({ error: 'bad_signature' }, 401);

  let body: unknown;
  try {
    body = JSON.parse(text);
  } catch {
    return json({ error: 'invalid_json' }, 400);
  }

  const tally: Tally = { sent: 0, failed: 0, authFailed: 0, transient: 0, skipped: {} };
  try {
    for (const ev of parseCommentEvents(body)) await handleOne(ev, cfg, store, deps, tally);
  } catch (error) {

    if (!(error instanceof DmStoreError)) console.error('[dm] unexpected error');
    return json({ error: 'storage_unavailable' }, 500);
  }

  if (tally.authFailed > 0) console.error(`[dm] token or permission rejected by Meta (${tally.authFailed}). Check the account token in the environment variables`);
  if (tally.skipped.rate_capped) console.warn(`[dm] hourly cap reached, skipped ${tally.skipped.rate_capped}`);

  if (tally.skipped.unknown_account) console.warn(`[dm] comment notification for an account that is not configured (${tally.skipped.unknown_account}). Check INSTAGRAM_DM_*_ID against the account user_id`);
  if (tally.transient > 0) return json({ error: 'send_failed', retry: true }, 500);

  return json(
    { ok: true, sent: tally.sent, failed: tally.failed, ...(tally.authFailed ? { auth_failed: tally.authFailed } : {}), skipped: tally.skipped },
    200,
  );
}
