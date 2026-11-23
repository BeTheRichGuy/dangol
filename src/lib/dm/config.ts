import type { Lang } from '../admin/utm';
import { siteOrigin } from '../site-origin';

export interface DmAccount {

  id: string;
  lang: Lang;
  token: string;
}

export interface DmConfig {
  appSecret: string;
  verifyToken: string;
  accounts: readonly DmAccount[];
  format: 'card' | 'text';
  apiVersion: string;

  graphBase: string;

  origin: string;
}

type Env = Record<string, string | undefined>;

const LANG_KEYS: ReadonlyArray<readonly [Lang, string]> = [['ko', 'KO'], ['en', 'EN'], ['ja', 'JA']];

function clean(raw: string | undefined): string {
  return (raw ?? '').trim().replace(/^(["'])(.*)\1$/, '$2').trim();
}

export function dmVerifyToken(env: Env): string | null {
  return clean(env.INSTAGRAM_VERIFY_TOKEN) || null;
}

export function dmConfig(env: Env): DmConfig | null {
  const appSecret = clean(env.INSTAGRAM_APP_SECRET);
  const verifyToken = dmVerifyToken(env);
  if (!appSecret || !verifyToken) return null;

  const accounts: DmAccount[] = [];
  for (const [lang, key] of LANG_KEYS) {
    const id = clean(env[`INSTAGRAM_DM_${key}_ID`]);
    const token = clean(env[`INSTAGRAM_DM_${key}_TOKEN`]);
    if (id && token) accounts.push({ id, lang, token });
  }
  if (accounts.length === 0) return null;

  const origin = siteOrigin(env);
  if (!origin.startsWith('https://')) return null;

  const version = clean(env.INSTAGRAM_GRAPH_VERSION);
  return {
    appSecret,
    verifyToken,
    accounts,
    format: clean(env.INSTAGRAM_DM_FORMAT) === 'text' ? 'text' : 'card',
    apiVersion: /^v\d{1,2}\.\d$/.test(version) ? version : 'v27.0',
    graphBase: clean(env.INSTAGRAM_GRAPH_HOST) === 'instagram' ? 'https://graph.instagram.com' : 'https://graph.facebook.com',
    origin,
  };
}
