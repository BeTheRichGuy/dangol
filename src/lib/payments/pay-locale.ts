export type ClientPay = 'off' | 'test' | 'paddle' | 'toss' | 'dodo' | 'skip';

export function payForLocale(mode: ClientPay, payLocales: readonly string[] | null, locale: string): ClientPay | 'closed' {
  const dodoOk = payLocales !== null && payLocales.includes(locale);
  if (mode === 'toss') return locale === 'ko' ? 'toss' : dodoOk ? 'dodo' : 'closed';
  if (mode === 'dodo') return dodoOk ? 'dodo' : 'closed';
  return mode;
}
