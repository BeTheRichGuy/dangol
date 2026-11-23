export const BUNDLE_PROMO = {

  name: 'Five-room bundle',

  badge: 'Opening offer',
  prices: {

    list: '$31.45',

    bundle: '$7.90',
  },

  listSr: 'Five rooms bought one by one:',
  bundleSr: 'Bundle price:',

  withLanterns: (n: number) => `${n} lanterns included`,

  short: { life: 'Life', decades: '10 years', love: 'Love', match: 'Match', year: '2027' },
  banner: {
    title: 'Every room in the shrine, all at once',
    lanterns: (n: number) => `Plus ${n} lanterns, yours right away`,
    roomsLabel: 'The five rooms',
    cta: 'Open all five rooms',
  },
};

export type BundlePromoCopy = typeof BUNDLE_PROMO;
