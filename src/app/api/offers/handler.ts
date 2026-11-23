import { bearerToken } from '../../../lib/account/server';
import { isLocale, type Locale } from '../../../content/locale';
import type { Ledger } from '../../../lib/payments/ledger';
import { firstPriceOn, NO_OFFERS } from '../../../lib/payments/offers';
import { paymentConfig } from '../../../lib/payments/payments';
import { availableOffers } from '../checkout/handler';
import { isReadingOpen, type ReadingEnv } from '../reading/handler';

const NO_STORE = { 'Cache-Control': 'no-store' } as const;

interface OffersDeps {
  env: ReadingEnv;

  verifyUser?: (token: string) => Promise<string | null>;
  ledger?: Ledger;
}

export async function handleOffersGet(request: Request, deps: OffersDeps): Promise<Response> {
  const pay = paymentConfig(deps.env);
  const asked = new URL(request.url).searchParams.get('l');
  const locale: Locale = isLocale(asked) ? asked : 'ko';
  const reply = (v: typeof NO_OFFERS) => Response.json(v, { headers: NO_STORE });
  if (!isReadingOpen(deps.env) || !firstPriceOn(deps.env)) return reply(NO_OFFERS);
  const token = bearerToken(request);
  const uid = token && deps.verifyUser ? await deps.verifyUser(token) : null;
  return reply(await availableOffers(pay, deps.ledger, uid, locale));
}
