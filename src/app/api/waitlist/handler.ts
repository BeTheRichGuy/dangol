import { WaitlistError, addToWaitlist, isWaitlistOpen, parseWaitlistInput } from '../../../lib/store';

const MAX_BODY_BYTES = 4096;

const NO_STORE = { 'Cache-Control': 'no-store' } as const;

function json(body: Record<string, unknown>, status: number): Response {
  return Response.json(body, { status, headers: NO_STORE });
}

export async function readBodyText(request: Request, maxBytes: number): Promise<string | null> {
  const reader = request.body?.getReader();
  if (!reader) return '';
  const chunks: Uint8Array[] = [];
  let total = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > maxBytes) {
      await reader.cancel();
      return null;
    }
    chunks.push(value);
  }
  const all = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    all.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return new TextDecoder().decode(all);
}

export function handleWaitlistStatus(): Response {
  return json({ open: isWaitlistOpen() }, 200);
}

export async function handleWaitlistPost(request: Request): Promise<Response> {

  const contentType = request.headers.get('content-type') ?? '';
  if (!contentType.toLowerCase().includes('application/json')) {
    return json({ error: 'unsupported_media_type' }, 415);
  }

  const declared = Number(request.headers.get('content-length'));
  if (Number.isFinite(declared) && declared > MAX_BODY_BYTES) {
    return json({ error: 'payload_too_large' }, 413);
  }

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

  const parsed = parseWaitlistInput(body);
  if (!parsed.ok) return json({ error: parsed.error }, 400);

  try {
    const { regularNo } = await addToWaitlist(parsed.value);
    return json({ regularNo }, 200);
  } catch (error) {
    if (error instanceof WaitlistError) {
      const status = error.code === 'storage_unavailable' || error.code === 'not_open' ? 503 : 400;
      return json({ error: error.code }, status);
    }

    console.error('[waitlist] unexpected error');
    return json({ error: 'storage_unavailable' }, 503);
  }
}
