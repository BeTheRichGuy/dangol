import { connection } from 'next/server';
import { accessTokenUser, serverAuthEnv } from '@/lib/account/server';
import { makeLedger } from '@/lib/payments/ledger';
import { handleOffersGet } from './handler';

export async function GET(request: Request) {
  await connection();
  const auth = serverAuthEnv();
  return handleOffersGet(request, {
    env: process.env,
    verifyUser: auth ? (token) => accessTokenUser(auth, token) : undefined,
    ledger: makeLedger(process.env),
  });
}
