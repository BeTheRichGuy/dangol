import type { BundlePromoCopy } from '../en/bundle-promo';

export const BUNDLE_PROMO_JA: BundlePromoCopy = {
  name: '5部屋セット',
  badge: 'オープン記念',
  prices: {
    list: '4,450円',
    bundle: '1,100円',
  },
  listSr: '5部屋を別々に買うと',
  bundleSr: 'セットなら',
  withLanterns: (n) => `灯り${n}個つき`,
  short: { life: '人生', decades: '10年', love: '恋愛', match: '相性', year: '2027' },
  banner: {
    title: '5つの部屋の扉が、いっぺんに開きます',
    lanterns: (n) => `灯り${n}個も、すぐにお渡しします`,
    roomsLabel: 'セットで開く部屋',
    cta: '5部屋まとめて開く',
  },
};
