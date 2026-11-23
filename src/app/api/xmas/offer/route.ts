import { handleXmasOfferPost } from './handler';

export async function POST() {
  return handleXmasOfferPost({ env: process.env });
}
