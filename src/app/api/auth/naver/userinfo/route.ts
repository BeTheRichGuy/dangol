import { handleNaverUserinfo } from './handler';

export async function GET(request: Request) {
  return handleNaverUserinfo(request);
}
