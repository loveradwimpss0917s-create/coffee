import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { Db } from '@coffee-lab/db';
import { schema } from '@coffee-lab/db';
import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { Hono } from 'hono';
import type { AppEnv } from './context';

const migrationsDir = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../../../../../packages/db/migrations',
);

/**
 * D1 と better-sqlite3 は同じ drizzle-orm/sqlite-core クエリビルダを使うため、
 * テストでは軽量な better-sqlite3 のインメモリDBを本番と同一マイグレーションSQL群（全ファイル、実行順）で
 * 初期化して使う。本番コードは必ず drizzle-orm/d1 経由（packages/db/src/index.ts、docs/02）。
 */
export function createTestDb(): Db {
  const sqlite = new Database(':memory:');
  sqlite.pragma('foreign_keys = ON');
  const migrationFiles = readdirSync(migrationsDir)
    .filter((name) => name.endsWith('.sql'))
    .sort();
  for (const file of migrationFiles) {
    sqlite.exec(readFileSync(path.join(migrationsDir, file), 'utf-8'));
  }
  return drizzle(sqlite, { schema }) as unknown as Db;
}

export type TestUser = NonNullable<AppEnv['Variables']['user']>;

export function makeTestUser(overrides: Partial<{ id: string; email: string }> = {}): TestUser {
  const now = new Date();
  return {
    id: overrides.id ?? 'usr_test1',
    email: overrides.email ?? 'test@example.com',
    name: 'Test User',
    emailVerified: true,
    image: null,
    isAnonymous: false,
    createdAt: now,
    updatedAt: now,
  } as TestUser;
}

export async function seedUser(db: Db, user: TestUser) {
  await db.insert(schema.user).values({
    id: user.id,
    name: user.name,
    email: user.email,
    emailVerified: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
}

/** サブルーターを db/user/session 注入済みのテスト用アプリにマウントする（Cloudflare/Better Authはバイパス）。 */
export function mountWithUser(subApp: Hono<AppEnv>, db: Db, user: TestUser | null): Hono<AppEnv> {
  const harness = new Hono<AppEnv>();
  harness.use('*', async (c, next) => {
    c.set('db', db);
    c.set('user', user);
    c.set('session', null);
    await next();
  });
  harness.route('/', subApp);
  return harness;
}

/** テストでレスポンスJSONの形を都度アサーションするための薄いキャストヘルパー。 */
export async function readJson<T>(res: Response): Promise<T> {
  return (await res.json()) as T;
}
