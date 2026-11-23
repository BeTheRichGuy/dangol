import { connection } from 'next/server';
import { handleWaitlistPost, handleWaitlistStatus } from './handler';

export async function POST(request: Request) {
  return handleWaitlistPost(request);
}

export async function GET() {
  await connection();
  return handleWaitlistStatus();
}
