import { toNextJsHandler } from 'better-auth/next-js';
import { getAuth } from '@/server/auth';

export const { GET, POST } = toNextJsHandler(async (request: Request) => {
  const auth = await getAuth(request);
  return auth.handler(request);
});
