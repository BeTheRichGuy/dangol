import { accessTokenUser, serverAuthEnv } from '@/lib/account/server';
import { makeLanterns } from '@/lib/chat/lanterns';
import { makeLedger } from '@/lib/payments/ledger';
import { handleCheckoutPost } from './handler';

export async function POST(request: Request) {
  const auth = serverAuthEnv();
  return handleCheckoutPost(request, {
    env: process.env,
    verifyUser: auth ? (token) => accessTokenUser(auth, token) : undefined,
    ledger: makeLedger(process.env),
    lanterns: makeLanterns(process.env),
  });
}
