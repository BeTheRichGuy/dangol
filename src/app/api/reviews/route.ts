import { accessTokenUser, serverAuthEnv } from '@/lib/account/server';
import { handleReviewsPost } from './handler';

export async function POST(request: Request) {
  const auth = serverAuthEnv();
  return handleReviewsPost(request, { env: process.env, verifyUser: auth ? (token) => accessTokenUser(auth, token) : undefined });
}
