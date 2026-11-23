import { connection } from 'next/server';
import { accessTokenUser, serverAuthEnv } from '@/lib/account/server';
import type { PromptLibrary } from '@/lib/ai/assemble';
import { loadPromptLibrary } from '@/lib/ai/load';
import { makeLanterns } from '@/lib/chat/lanterns';
import { handleChatPost, handleChatStatus } from './handler';

export const maxDuration = 90;

let prompts: PromptLibrary | null = null;

function readPrompts(): PromptLibrary {
  prompts ??= loadPromptLibrary();
  return prompts;
}

export async function GET() {
  await connection();
  return handleChatStatus(process.env, makeLanterns(process.env));
}

export async function POST(request: Request) {
  const auth = serverAuthEnv();
  return handleChatPost(request, {
    env: process.env,
    prompts: readPrompts,
    lanterns: makeLanterns(process.env),
    verifyUser: auth ? (token) => accessTokenUser(auth, token) : undefined,
  });
}
