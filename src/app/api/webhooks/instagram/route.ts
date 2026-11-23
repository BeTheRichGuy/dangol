import { handleInstagramVerify, handleInstagramWebhook } from './handler';

export async function GET(request: Request) {
  return handleInstagramVerify(request, { env: process.env });
}

export async function POST(request: Request) {
  return handleInstagramWebhook(request, { env: process.env });
}
