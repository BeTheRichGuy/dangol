'use client';

import { activeLocale } from '@/content/locale';
import { readUtm } from '@/components/utm-capture';
import type { EventName, PropValue } from './events';
import { inAppBrowser, metaCallFor } from './meta';
import type { ProductKey } from '../rooms/themes';

const SID_KEY = 'dangol.sid.v1';
const FLUSH_MS = 1500;

const queue: Record<string, unknown>[] = [];
let timer: number | null = null;
let hooked = false;

function sid(): string {
  try {
    let v = window.sessionStorage.getItem(SID_KEY);
    if (!v) {
      const bytes = crypto.getRandomValues(new Uint8Array(12));
      v = `s_${Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('')}`;
      window.sessionStorage.setItem(SID_KEY, v);
    }
    return v;
  } catch {
    return 's_nostorage';
  }
}

function enabled(): boolean {
  if (typeof window === 'undefined') return false;
  const host = window.location.hostname;
  return host !== 'localhost' && host !== '127.0.0.1' && host !== '[::1]' && !host.endsWith('.localhost');
}

function flush() {
  if (timer !== null) {
    window.clearTimeout(timer);
    timer = null;
  }
  if (queue.length === 0) return;
  const body = JSON.stringify({ events: queue.splice(0, 20) });
  try {
    const sent = navigator.sendBeacon?.('/api/events', new Blob([body], { type: 'text/plain' }));
    if (!sent) void fetch('/api/events', { method: 'POST', body, keepalive: true }).catch(() => {});
  } catch {

  }
  if (queue.length > 0) flush();
}

export function referrerHost(referrer: string, ownHost: string): string | null {
  if (!referrer) return null;
  try {
    const host = new URL(referrer).hostname.toLowerCase().replace(/^www\./, '');
    if (!host || host === ownHost.toLowerCase().replace(/^www\./, '')) return null;
    return host.slice(0, 60);
  } catch {
    return null;
  }
}

export function track(name: EventName, props: Record<string, PropValue> & { room?: ProductKey } = {}): void {
  if (!enabled()) return;
  const { room, ...rest } = props;

  if (name === 'landing_view') {
    const ref = referrerHost(document.referrer, window.location.hostname);
    if (ref) rest.ref = ref;
  }

  if (name.startsWith('pay_') || name.startsWith('checkout_')) {
    const inapp = inAppBrowser(navigator.userAgent);
    if (inapp) rest.inapp = inapp;
  }

  const meta = window.fbq ? metaCallFor(name, room ?? null, rest) : null;
  if (meta) window.fbq?.(meta.kind, meta.event, meta.params);
  queue.push({ name, sid: sid(), room: room ?? null, locale: activeLocale(), path: window.location.pathname, utm: readUtm() ?? null, props: rest });
  if (!hooked) {
    hooked = true;
    window.addEventListener('pagehide', flush);
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') flush();
    });
  }
  if (timer === null) timer = window.setTimeout(flush, FLUSH_MS);
}

export function currentSid(): string | null {
  return enabled() ? sid() : null;
}

export function flushTracking(): void {
  if (enabled()) flush();
}
