// Vitest には Next.js の "react-server" 解決条件がなく、`server-only` パッケージが
// 常にthrowしてしまう。テスト実行時のみ no-op に差し替える（vitest.config.ts の alias）。
export {};
