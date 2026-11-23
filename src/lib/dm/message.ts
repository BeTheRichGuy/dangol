import { DM_EN } from '../../content/en/dm';
import { DM_JA } from '../../content/ja/dm';
import { DM_KO } from '../../content/ko/dm';
import type { DmCopy } from '../../content/en/dm';
import { TALISMAN_EN } from '../../content/en/talisman';
import { TALISMAN_JA } from '../../content/ja/talisman';
import { TALISMAN_KO } from '../../content/ko/talisman';
import { buildUtmUrl, type Lang } from '../admin/utm';
import type { TalismanId } from '../talisman';
import { talismanImageUrl } from '../talisman/art';

const COPY: Record<Lang, { dm: DmCopy; items: typeof TALISMAN_EN.items }> = {
  ko: { dm: DM_KO, items: TALISMAN_KO.items },
  en: { dm: DM_EN, items: TALISMAN_EN.items },
  ja: { dm: DM_JA, items: TALISMAN_JA.items },
};

export interface Dm {
  talisman: TalismanId;
  lang: Lang;

  imageUrl: string;

  siteUrl: string;
  text: string;
  card: { title: string; subtitle: string; buttonTitle: string };
}

export type DmEdition = 'xmas';

export function buildDm({ talisman, lang, origin, edition }: { talisman: TalismanId; lang: Lang; origin: string; edition?: DmEdition }): Dm {
  const { dm, items } = COPY[lang];
  const item = items[talisman];
  const base = origin.replace(/\/+$/, '');
  const imageUrl = `${base}${talismanImageUrl(talisman, { width: 768 })}`;
  const xmas = edition === 'xmas';
  const built = buildUtmUrl({ lang, source: 'instagram', medium: 'dm', campaign: xmas ? 'xmas' : 'talisman', content: talisman }, base);

  if (!built.url) throw new Error('dm: utm link invalid');
  const siteUrl = xmas ? built.url.replace(`${base}/?`, `${base}/xmas?`) : built.url;
  const pitch = xmas ? dm.xmas.pitch : dm.pitch;
  return {
    talisman,
    lang,
    imageUrl,
    siteUrl,
    text: [dm.hello(item.name, item.line), imageUrl, pitch, dm.privacy, siteUrl].join('\n\n'),
    card: { title: item.name, subtitle: xmas ? dm.xmas.cardSubtitle : dm.cardSubtitle, buttonTitle: xmas ? dm.xmas.button : dm.button },
  };
}

export function textMessage(dm: Dm): { text: string } {
  return { text: dm.text };
}

export function cardMessage(dm: Dm) {
  return {
    attachment: {
      type: 'template' as const,
      payload: {
        template_type: 'generic' as const,
        elements: [
          {
            title: dm.card.title,
            subtitle: dm.card.subtitle,
            image_url: dm.imageUrl,
            default_action: { type: 'web_url' as const, url: dm.siteUrl },
            buttons: [{ type: 'web_url' as const, url: dm.siteUrl, title: dm.card.buttonTitle }],
          },
        ],
      },
    },
  };
}
