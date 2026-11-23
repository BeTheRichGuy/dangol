import { accessTokenUser, serverAuthEnv } from '@/lib/account/server';
import { makeLanterns } from '@/lib/chat/lanterns';
import { handleLanternCheckin } from '../handler';

export async function POST(request: Request) {
  const auth = serverAuthEnv();
  return handleLanternCheckin(request, { env: process.env, lanterns: makeLanterns(process.env), verifyUser: auth ? (token) => accessTokenUser(auth, token) : undefined });
}
