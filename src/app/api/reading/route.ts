import { after, connection } from 'next/server';
import { reportToRow } from '@/lib/analytics/events';
import { recordEvents } from '../events/handler';
import { claimReading } from '@/lib/payments/claims';
import { accessTokenUser, serverAuthEnv } from '@/lib/account/server';
import type { PromptLibrary } from '@/lib/ai/assemble';
import { loadPromptLibrary } from '@/lib/ai/load';
import { readingJobStore } from '@/lib/account/reading-jobs';
import { handleReadingPost, handleReadingStatus } from './handler';

export const maxDuration = 300;

let prompts: PromptLibrary | null = null;

function readPrompts(): PromptLibrary {
  prompts ??= loadPromptLibrary();
  return prompts;
}

export async function GET() {
  await connection();
  return handleReadingStatus(process.env);
}

export async function POST(request: Request) {
  const auth = serverAuthEnv();
  return handleReadingPost(request, {
    env: process.env,
    prompts: readPrompts,
    verifyUser: auth ? (token) => accessTokenUser(auth, token) : undefined,
    claim: (order) => claimReading(process.env, order),

    jobs: auth ? readingJobStore(auth) : undefined,
    schedule: (task) => after(task),

    report: (r) => {
      console.info('[reading]', JSON.stringify(r));
      const save = () => recordEvents(process.env, [reportToRow(r)]);
      try {
        after(save);
      } catch {
        void save();
      }
    },
  });
}
