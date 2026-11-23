import { UI as UI_EN } from './en/ui';
import { UI_JA } from './ja/ui';
import { UI_KO } from './ko/ui';
import { ROOMS_COPY as ROOMS_EN } from './en/rooms';
import { ROOMS_JA } from './ja/rooms';
import { ROOMS_KO } from './ko/rooms';
import { LEGAL as LEGAL_EN } from './en/legal';
import { LEGAL_JA } from './ja/legal';
import { LEGAL_KO } from './ko/legal';
import { overlay, type Locale } from './locale';
import { ROOM_KEYS, type RoomKey } from '@/lib/rooms/themes';

const UI = { en: UI_EN, ko: overlay(UI_EN, UI_KO), ja: overlay(UI_EN, UI_JA) } as const;
const ROOMS = { en: ROOMS_EN, ko: overlay(ROOMS_EN, ROOMS_KO), ja: overlay(ROOMS_EN, ROOMS_JA) } as const;
const LEGAL = { en: LEGAL_EN, ko: LEGAL_KO, ja: LEGAL_JA } as const;

export interface LandingCopy {
  brand: string;
  hangul: string;
  title: string;
  description: string;
  posterAlt: string;
  cta: string;
  howHeading: string;
  how: readonly string[];
  roomsHeading: string;
  roomsSub: string;

  roomsPrice: { now: string; was: string; wasSr: string };
  rooms: readonly { key: RoomKey; title: string; question: string; gain: string }[];
  about: { title: string; sections: readonly { heading: string; body: readonly string[] }[] };
  links: readonly { href: string; label: string }[];
}

export function landingCopy(locale: Locale): LandingCopy {
  const ui = UI[locale];
  const rooms = ROOMS[locale];
  return {
    brand: ui.brand.name,
    hangul: ui.brand.hangul,
    title: ui.meta.title,
    description: ui.meta.description,
    posterAlt: ui.home.posterAlt,
    cta: ui.home.cta,
    howHeading: rooms.home.howHeading,
    how: rooms.home.how,
    roomsHeading: rooms.home.heading,
    roomsSub: rooms.home.sub,
    roomsPrice: { now: rooms.first.price, was: rooms.price, wasSr: rooms.first.wasSr },
    rooms: ROOM_KEYS.map((key) => ({ key, title: rooms.rooms[key].title, question: rooms.rooms[key].question, gain: rooms.rooms[key].gain })),
    about: LEGAL[locale].about,
    links: [
      { href: '/about', label: ui.common.links.about },
      { href: '/pricing', label: ui.common.links.pricing },
      { href: '/wont-read', label: ui.common.wontReadLink },
      { href: '/privacy', label: ui.common.links.privacy },
      { href: '/terms', label: ui.common.links.terms },
      { href: '/refund', label: ui.common.links.refund },
    ],
  };
}
