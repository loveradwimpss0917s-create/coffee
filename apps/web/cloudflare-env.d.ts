// wrangler.jsonc のバインディング・変数を @opennextjs/cloudflare の CloudflareEnv に反映する。
// `wrangler types` の手動生成を避け、docs/07/08 で確定したバインディングのみ最小限に宣言する。
declare global {
  interface CloudflareEnv {
    DB: D1Database;
    BETTER_AUTH_SECRET: string;
    // 未設定時はリクエストの origin から自動導出する（apps/web/src/server/auth.ts）
    BETTER_AUTH_URL?: string;
  }
}

export {};
