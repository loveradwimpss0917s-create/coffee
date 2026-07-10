import 'server-only';
import { Hono } from 'hono';
import { HTTPException } from 'hono/http-exception';
import { nanoid } from 'nanoid';
import { beansApp } from './beans';
import { brewsApp } from './brews';
import type { AppEnv } from './context';
import { dbMiddleware, sessionMiddleware } from './context';
import { problem } from './middleware/problem';
import { recipesApp } from './recipes';
import { settingsApp } from './settings';

/**
 * Hono アプリ本体。共通ミドルウェアの適用順は docs/08 §2 の通り
 * requestId → logger → auth（セッション解決） → zValidator → handler。
 * rateLimit(KV) は 2-8 で追加する。
 */
export const app = new Hono<AppEnv>().basePath('/api/v1');

app.use('*', async (c, next) => {
  const requestId = nanoid();
  c.header('X-Request-Id', requestId);
  const start = Date.now();
  await next();
  // PII（メール・セッショントークン）は出さない（docs/12 §9）
  console.log(
    JSON.stringify({
      requestId,
      method: c.req.method,
      path: c.req.path,
      status: c.res.status,
      durationMs: Date.now() - start,
    }),
  );
});

app.use('*', dbMiddleware, sessionMiddleware);

app.route('/beans', beansApp);
app.route('/recipes', recipesApp);
app.route('/brews', brewsApp);
app.route('/settings', settingsApp);

app.onError((err, c) => {
  if (err instanceof HTTPException) {
    return err.getResponse();
  }
  console.error(err);
  return c.json(problem('internal', 'サーバーエラーが発生しました', 500), 500);
});

app.notFound((c) => c.json(problem('not_found', 'エンドポイントが見つかりません', 404), 404));

export type AppType = typeof app;
