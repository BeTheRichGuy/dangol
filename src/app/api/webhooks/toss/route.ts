import { makeLanterns } from '@/lib/chat/lanterns';
import { handleTossWebhook } from './handler';

export async function POST(request: Request) {
  return handleTossWebhook(request, { env: process.env, lanterns: makeLanterns(process.env) });
}
