import { connection } from 'next/server';
import { handleXmasViewers } from './handler';

export async function GET(request: Request) {
  await connection();
  return handleXmasViewers(request, { env: process.env });
}
