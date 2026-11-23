import { buildContinue, type ContinueData } from '../continue-copy';
import { ROOMS_COPY as ROOMS_EN } from '../en/rooms';
import { overlay } from '../locale';
import data from './continue.data.json';
import { ROOMS_JA } from './rooms';

const R = overlay(ROOMS_EN, ROOMS_JA);

const built = buildContinue(data as ContinueData, {
  keeperNames: { mansin: R.keepers.mansin.name, yeon: R.keepers.yeon.name, reunion: R.keepers.u12.name },
  lifeTitles: R.rooms.life.contents.map((c) => c.title),
  groupName: { peer: '比劫', output: '食傷', wealth: '財星', power: '官星', resource: '印星' },
  basis: (name, count) => `根拠: 表に出ている字のうち ${name} は ${count} つ(蔵干は数えません)`,
});

export const CONTINUE_JA = built.continueCopy;
export const LIFE_OFFER_JA = built.offer;
export const STICKY_JA = built.sticky;
export const OTHER_KEEPERS_JA = built.keepers;
export const FREE_RESULT_JA = built.teaser;
export const GAP_JA = built.gap;
