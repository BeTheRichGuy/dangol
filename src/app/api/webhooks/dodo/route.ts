import { makeLanterns } from '@/lib/chat/lanterns';
import { handleDodoWebhook } from './handler';

export async function POST(request: Request) {
  return handleDodoWebhook(request, { env: process.env, lanterns: makeLanterns(process.env) });
}
