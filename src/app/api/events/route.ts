import { handleEventsPost } from './handler';

export async function POST(request: Request) {
  return handleEventsPost(request, { env: process.env });
}
