import 'server-only';
import type { Db } from '@coffee-lab/db';
import { createDb } from '@coffee-lab/db';
import { getCloudflareContext } from '@opennextjs/cloudflare';
import type { MiddlewareHandler } from 'hono';
import { getAuth } from '../auth';
import { problem } from './middleware/problem';

type Auth = Awaited<ReturnType<typeof getAuth>>;
type Session = NonNullable<Awaited<ReturnType<Auth['api']['getSession']>>>;

export type AppEnv = {
  Variables: {
    db: Db;
    user: Session['user'] | null;
    session: Session['session'] | null;
  };
};

/** D1 バインディングから Drizzle クライアントを作り、リクエスト全体で共有する。 */
export const dbMiddleware: MiddlewareHandler<AppEnv> = async (c, next) => {
  const { env } = await getCloudflareContext({ async: true });
  c.set('db', createDb(env.DB));
  await next();
};

/** Better Auth のセッション Cookie を解決する（docs/08 §2、共通ミドルウェア）。 */
export const sessionMiddleware: MiddlewareHandler<AppEnv> = async (c, next) => {
  const auth = await getAuth(c.req.raw);
  const result = await auth.api.getSession({ headers: c.req.raw.headers });
  c.set('user', result?.user ?? null);
  c.set('session', result?.session ?? null);
  await next();
};

/** 認証必須エンドポイント用ガード。 */
export const requireAuth: MiddlewareHandler<AppEnv> = async (c, next) => {
  if (!c.get('user')) {
    return c.json(problem('unauthorized', '認証が必要です', 401), 401);
  }
  await next();
};
