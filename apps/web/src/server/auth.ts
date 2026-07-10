import 'server-only';
import { createDb, schema } from '@coffee-lab/db';
import { getCloudflareContext } from '@opennextjs/cloudflare';
import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { nextCookies } from 'better-auth/next-js';
import { anonymous } from 'better-auth/plugins/anonymous';

function buildAuth(db: ReturnType<typeof createDb>, baseURL: string | undefined) {
  return betterAuth({
    secret: process.env.BETTER_AUTH_SECRET,
    baseURL,
    database: drizzleAdapter(db, {
      provider: 'sqlite',
      schema,
      usePlural: false,
      // D1 は better-auth のインタラクティブトランザクションに未対応（docs/07 §1）
      transaction: false,
    }),
    emailAndPassword: {
      enabled: true,
      minPasswordLength: 8,
    },
    session: {
      expiresIn: 60 * 60 * 24 * 30, // 30日
      updateAge: 60 * 60 * 24, // ローリング更新（docs/12 §2）
    },
    plugins: [anonymous(), nextCookies()],
  });
}

type Auth = ReturnType<typeof buildAuth>;

let cached: Auth | undefined;

/**
 * D1 バインディングは Workers のリクエストスコープでのみ取得できるため、
 * モジュールトップレベルで betterAuth() を組み立てず、リクエスト時に遅延初期化する。
 * 同一 isolate 内ではバインディングは不変なのでインスタンスをキャッシュする。
 *
 * baseURL: 環境変数 `BETTER_AUTH_URL` が未設定の場合、リクエストの origin から導出する。
 * Workers Builds のプレビューデプロイはハッシュ付きURLがデプロイ毎に変わるため、
 * 固定値をコミットせずここで動的に解決する（docs/13）。
 */
export async function getAuth(request?: Request): Promise<Auth> {
  if (cached) return cached;
  const { env } = await getCloudflareContext({ async: true });
  const baseURL =
    process.env.BETTER_AUTH_URL || (request ? new URL(request.url).origin : undefined);
  cached = buildAuth(createDb(env.DB), baseURL);
  return cached;
}
