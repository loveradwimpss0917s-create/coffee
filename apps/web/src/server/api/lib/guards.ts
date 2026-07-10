import 'server-only';
import type { Context } from 'hono';
import { HTTPException } from 'hono/http-exception';
import type { AppEnv } from '../context';
import { problem } from '../middleware/problem';

/** requireAuth 通過後に呼ぶ。null になり得ない前提を型でも表現する。 */
export function requireUser(c: Context<AppEnv>) {
  const user = c.get('user');
  if (!user) {
    throw new HTTPException(401, {
      res: Response.json(problem('unauthorized', '認証が必要です', 401), { status: 401 }),
    });
  }
  return user;
}

export function notFound(message: string): never {
  throw new HTTPException(404, {
    res: Response.json(problem('not_found', message, 404), { status: 404 }),
  });
}
