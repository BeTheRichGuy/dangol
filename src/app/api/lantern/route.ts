import { connection } from 'next/server';
import { accessTokenUser, serverAuthEnv } from '@/lib/account/server';
import { makeLanterns } from '@/lib/chat/lanterns';
import { handleLanternEarn, handleLanternGet, type LanternDeps } from './handler';

function deps(): LanternDeps {
  const auth = serverAuthEnv();
  return { env: process.env, lanterns: makeLanterns(process.env), verifyUser: auth ? (token) => accessTokenUser(auth, token) : undefined };
}

export async function GET(request: Request) {
  await connection();
  return handleLanternGet(request, deps());
}

export async function POST(request: Request) {
  return handleLanternEarn(request, deps());
}
