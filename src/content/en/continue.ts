import { buildContinue, type ContinueData } from '../continue-copy';
import data from './continue.data.json';
import { ROOMS_COPY } from './rooms';

const R = ROOMS_COPY;

const built = buildContinue(data as ContinueData, {
  keeperNames: { mansin: R.keepers.mansin.name, yeon: R.keepers.yeon.name, reunion: R.keepers.u12.name },
  lifeTitles: R.rooms.life.contents.map((c) => c.title),
  groupName: { peer: 'Peer', output: 'Output', wealth: 'Wealth', power: 'Power', resource: 'Resource' },
  basis: (name, count) => `Basis: ${count} of the visible characters belong to the ${name} group (hidden stems are not counted)`,
});

export const CONTINUE_EN = built.continueCopy;
export const LIFE_OFFER_EN = built.offer;
export const STICKY_EN = built.sticky;
export const OTHER_KEEPERS_EN = built.keepers;
export const FREE_RESULT_EN = built.teaser;
export const GAP_EN = built.gap;
