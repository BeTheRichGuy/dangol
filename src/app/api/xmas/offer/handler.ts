import { paymentConfig, type PaymentEnv } from '../../../../lib/payments/payments';
import { signXmasOffer } from '../../../../lib/xmas/offer';
import { XMAS_OFFER_MS } from '../../../../lib/xmas/product';

const NO_STORE = { 'Cache-Control': 'no-store' } as const;

export async function handleXmasOfferPost(deps: { env: PaymentEnv; now?: () => number }): Promise<Response> {
  const pay = paymentConfig(deps.env);
  if (pay.mode !== 'test' && pay.mode !== 'paddle' && pay.mode !== 'toss' && pay.mode !== 'dodo') {
    return Response.json({ error: 'not_open' }, { status: 503, headers: NO_STORE });
  }
  const until = (deps.now ?? Date.now)() + XMAS_OFFER_MS;
  return Response.json({ token: await signXmasOffer(until, pay.secret), until }, { status: 200, headers: NO_STORE });
}
