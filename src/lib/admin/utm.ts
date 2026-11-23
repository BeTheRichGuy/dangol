export const SITE_ORIGIN = 'https://dangolsaju.app';
export const LANGS = ['ko', 'ja', 'en'] as const;
export type Lang = (typeof LANGS)[number];

export const SOURCES = ['instagram', 'tiktok', 'x', 'kakao', 'community', 'reddit', 'meta', 'youtube', 'naver', 'threads', 'email'] as const;
export const MEDIUMS = ['bio', 'reels', 'video', 'feed', 'story', 'post', 'chat', 'paid', 'comment', 'dm'] as const;

const VALUE = /^[a-z0-9][a-z0-9_-]{0,39}$/;

export interface UtmInput {
  lang: string;
  source: string;
  medium: string;
  campaign: string;
  content?: string;
  term?: string;

  type?: string;
}

export interface Built {
  url: string | null;
  errors: string[];
}

const field = (name: string, v: string | undefined, required: boolean, errors: string[]): string => {
  const x = (v ?? '').trim();
  if (!x) {
    if (required) errors.push(`${name} 을(를) 적어 주세요`);
    return '';
  }
  if (!VALUE.test(x)) errors.push(`${name} 은(는) 소문자 영문·숫자·_·- 만 쓸 수 있어요(예: ${name === 'campaign' ? 'launch' : 'r1'})`);
  return x;
};

export function buildUtmUrl(input: UtmInput, origin: string = SITE_ORIGIN): Built {
  const errors: string[] = [];
  const lang = (input.lang ?? '').trim();
  if (!(LANGS as readonly string[]).includes(lang)) errors.push('언어는 ko, ja, en 중 하나');
  const source = field('source', input.source, true, errors);
  const medium = field('medium', input.medium, true, errors);
  const campaign = field('campaign', input.campaign, true, errors);
  const content = field('content', input.content, false, errors);
  const term = field('term', input.term, false, errors);
  const type = field('type', input.type, false, errors);
  if (errors.length) return { url: null, errors };
  const q: string[] = [];
  if (type) q.push(`t=${type}`);
  q.push(`l=${lang}`, `utm_source=${source}`, `utm_medium=${medium}`, `utm_campaign=${campaign}`);
  if (content) q.push(`utm_content=${content}`);
  if (term) q.push(`utm_term=${term}`);
  return { url: `${origin.replace(/\/+$/, '')}/?${q.join('&')}`, errors: [] };
}

export function extractSiteLinks(text: string): string[] {

  const found = text.match(/(?<![\w.-])(?:https?:\/\/)?(?:www\.)?dangolsaju\.app(?:[/?#][^\s"'<>)\]]*)?/gi) ?? [];
  return [...new Set(found.map((u) => u.replace(/[.,;:!?。、]+$/, '')))];
}

const SOURCE_ALIAS: Record<string, string> = { ig: 'instagram', insta: 'instagram', tt: 'tiktok', twitter: 'x', yt: 'youtube', fb: 'meta', facebook: 'meta' };

export interface LinkCheck {
  url: string;
  ok: boolean;
  problems: string[];
}

export function checkUtmUrl(raw: string): LinkCheck {
  const problems: string[] = [];
  let u: URL;
  try {
    u = new URL(/^https?:\/\//i.test(raw) ? raw : `https://${raw}`);
  } catch {
    return { url: raw, ok: false, problems: ['주소로 읽을 수 없어요'] };
  }
  if (u.hostname.toLowerCase().startsWith('www.')) problems.push('www. 없이 dangolsaju.app 으로 쓰세요(같은 곳으로 넘어가지만 주소를 하나로 맞춰요)');
  const q = u.searchParams;
  const lang = q.get('l');
  if (!lang) problems.push('l(언어)이 없어요: ?l=ko, ?l=ja, ?l=en');
  else if (!(LANGS as readonly string[]).includes(lang)) problems.push(`l=${lang} 은 쓰지 않는 값이에요(ko, ja, en)`);
  const source = q.get('utm_source');
  const medium = q.get('utm_medium');
  if (!source) problems.push('utm_source(채널)가 없어요');
  else {
    const fix = SOURCE_ALIAS[source.toLowerCase()];
    if (fix) problems.push(`utm_source=${source} 는 ${fix} 로 통일해요(분석이 둘로 갈라져요)`);
    else if (!VALUE.test(source)) problems.push('utm_source 는 소문자 영문·숫자·_·- 만 쓸 수 있어요');
  }
  if (!medium) problems.push('utm_medium(형식)이 없어요');
  else if (medium === 'social') problems.push('utm_medium=social 은 인스타가 임의로 붙이는 값이에요. bio·reels·feed 처럼 구체적으로 적으세요');
  else if (!VALUE.test(medium)) problems.push('utm_medium 은 소문자 영문·숫자·_·- 만 쓸 수 있어요');
  const campaign = q.get('utm_campaign');
  if (!campaign) problems.push('utm_campaign(캠페인 이름)이 없어요(예: launch)');
  else if (!VALUE.test(campaign)) problems.push('utm_campaign 은 소문자 영문·숫자·_·- 만 쓸 수 있어요');
  for (const k of ['utm_content', 'utm_term']) {
    const v = q.get(k);
    if (v && !VALUE.test(v)) problems.push(`${k} 은 소문자 영문·숫자·_·- 만 쓸 수 있어요`);
  }
  return { url: raw, ok: problems.length === 0, problems };
}

export function checkText(text: string): LinkCheck[] {
  return extractSiteLinks(text).map(checkUtmUrl);
}
