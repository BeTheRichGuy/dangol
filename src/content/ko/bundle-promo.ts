import type { BundlePromoCopy } from '../en/bundle-promo';

export const BUNDLE_PROMO_KO: BundlePromoCopy = {
  name: '5개 방 묶음',
  badge: '오픈 기념',
  prices: {
    list: '24,500원',
    bundle: '9,900원',
  },
  listSr: '다섯 방을 따로 사면',
  bundleSr: '묶음으로는',
  withLanterns: (n) => `등불 ${n}개 함께`,
  short: { life: '인생', decades: '10년', love: '연애', match: '궁합', year: '2027' },
  banner: {
    title: '다섯 방의 문이 한꺼번에 열려요',
    lanterns: (n) => `등불 ${n}개도 바로 드려요`,
    roomsLabel: '함께 열리는 방',
    cta: '다섯 방 한 번에 열기',
  },
};
