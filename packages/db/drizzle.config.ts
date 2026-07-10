import { defineConfig } from 'drizzle-kit';

/**
 * `pnpm db:generate` はスキーマ差分からSQLを生成するのみ（ライブ接続不要）。
 * 生成したSQLは `wrangler d1 migrations apply` で適用する（docs/07 §4, docs/13）。
 * そのため driver/dbCredentials は設定しない。
 */
export default defineConfig({
  dialect: 'sqlite',
  schema: './src/schema/index.ts',
  out: './migrations',
});
