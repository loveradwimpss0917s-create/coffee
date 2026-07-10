# CLAUDE.md — 実装者ガイド

このリポジトリは **Coffee Recipe Lab**（味から逆算するコーヒーレシピ生成アプリ）です。
設計書は `docs/` にあり、**設計書が唯一の正**です。設計と矛盾する実装をする前に必ず設計書を更新してください。

## 最初に読むべきもの

1. `docs/15-roadmap.md` — 今どのフェーズで何を実装すべきか
2. `docs/04-development-rules.md` — 命名規則・コーディング規約・Git運用
3. 実装対象に対応する設計書（例: エンジン実装なら `docs/10-recipe-engine.md`）

## リポジトリ構成（要点）

```
apps/web          # Next.js アプリ（UI + API Route）
packages/engine   # レシピ生成エンジン（純粋TS・フレームワーク非依存・最重要）
packages/db       # Drizzle スキーマ + マイグレーション
docs/             # 設計書（唯一の正）
```

## 絶対に守るルール

- `packages/engine` から React / Next.js / Cloudflare API を **絶対に import しない**（純粋関数のみ）
- エンジンの入出力はすべて Zod スキーマで定義し、`engineVersion` を出力に含める
- ドリッパー・グラインダーの特性値はコードに埋め込まず、`packages/engine/src/data/` のデータファイルに置く
- DB アクセスは Drizzle 経由のみ。生SQL禁止
- API 境界では必ず Zod でバリデーション
- `any` 禁止（`unknown` + narrowing を使う）
- コミットは Conventional Commits（`feat:` `fix:` `docs:` など）
- 1 PR = 1 関心事。ロードマップのタスク粒度に従う

## よく使うコマンド（実装後に有効）

```bash
pnpm install          # 依存インストール
pnpm dev              # 開発サーバー
pnpm lint             # Biome チェック
pnpm typecheck        # tsc --noEmit
pnpm test             # Vitest
pnpm test:e2e         # Playwright
pnpm build            # ビルド
pnpm db:generate      # Drizzle マイグレーション生成
pnpm db:migrate:local # ローカル D1 に適用
```

## 実装時の判断基準

- 迷ったら「保守性・可読性・型安全」を優先。賢いコードより読めるコード
- 設計書にない機能を勝手に追加しない。必要なら設計書に追記提案を先に行う
- テスト: エンジンはゴールデンテスト必須（`docs/14-testing.md`）
- UI: `docs/05-design-system.md` のトークン以外の色・余白をハードコードしない
