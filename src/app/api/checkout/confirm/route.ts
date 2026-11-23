import { after } from 'next/server';
import { accessTokenUser, serverAuthEnv } from '@/lib/account/server';
import { recordEvents } from '../../events/handler';
import { sendMetaPurchase } from '@/lib/analytics/meta-capi';
import { makeLanterns } from '@/lib/chat/lanterns';
import { makeLedger } from '@/lib/payments/ledger';
import { handleCheckoutConfirm } from '../handler';

export async function POST(request: Request) {
  const auth = serverAuthEnv();
  return handleCheckoutConfirm(request, {
    env: process.env,
    verifyUser: auth ? (token) => accessTokenUser(auth, token) : undefined,
    onConfirmed: (row) => after(() => recordEvents(process.env, [row])),
    onPurchase: (purchase) => after(() => sendMetaPurchase(process.env, purchase, { userAgent: request.headers.get('user-agent') })),
    ledger: makeLedger(process.env),
    lanterns: makeLanterns(process.env),
  });
}
