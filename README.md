# Coffee Recipe Lab ☕

**味から逆算する、コーヒードリップレシピ生成アプリ**

Coffee Recipe Lab は、豆・焙煎度・精製方法・器具・味の好みなどの入力から、
抽出理論（SCA ゴールデンカップ基準・抽出収率モデル・競技レシピの知見）に基づいて
**最適なドリップレシピを動的に生成する** Web アプリケーションです。

> 📌 現在は **設計フェーズ** です。実装は `docs/` の設計書に従って段階的に行います。

## ドキュメント一覧

| # | ドキュメント | 内容 |
|---|---|---|
| 01 | [リポジトリレビュー](docs/01-repository-review.md) | 現状確認・問題点・懸念事項 |
| 02 | [アーキテクチャ・技術選定](docs/02-architecture.md) | 全体設計書・技術選定理由 |
| 03 | [ディレクトリ構成](docs/03-directory-structure.md) | モノレポ構成・設定ファイル・package構成 |
| 04 | [開発ルール](docs/04-development-rules.md) | 命名規則・Git運用・ブランチ戦略・コーディング規約 |
| 05 | [デザインシステム](docs/05-design-system.md) | UI/UX設計方針・デザイントークン |
| 06 | [画面設計](docs/06-screens.md) | 画面一覧・画面遷移図・ワイヤーフレーム |
| 07 | [データベース設計](docs/07-database.md) | D1 スキーマ・マイグレーション戦略 |
| 08 | [API設計](docs/08-api.md) | エンドポイント仕様・バリデーション |
| 09 | [状態管理・コンポーネント設計](docs/09-state-components.md) | クライアント状態・コンポーネント階層 |
| 10 | [レシピ生成エンジン](docs/10-recipe-engine.md) | アルゴリズム・味覚パラメータ・科学的根拠 |
| 11 | [器具対応設計](docs/11-equipment.md) | ドリッパー・グラインダー対応 |
| 12 | [セキュリティ設計](docs/12-security.md) | 認証・入力検証・レートリミット |
| 13 | [デプロイ・CI/CD](docs/13-deployment-ci.md) | Cloudflare デプロイ・GitHub Actions |
| 14 | [テスト戦略](docs/14-testing.md) | ユニット・統合・E2E |
| 15 | [ロードマップ](docs/15-roadmap.md) | MVP → β → v1.0 → v2.0 |

## 技術スタック（概要）

- **フレームワーク**: Next.js (App Router) + OpenNext Cloudflare adapter
- **言語**: TypeScript (strict)
- **UI**: Tailwind CSS v4 + shadcn/ui + Motion
- **インフラ**: Cloudflare Workers / D1 / KV / R2
- **ORM**: Drizzle ORM
- **認証**: Better Auth
- **コアエンジン**: `@coffee-lab/engine`（フレームワーク非依存の純粋 TypeScript）

詳細は [docs/02-architecture.md](docs/02-architecture.md) を参照。

## 実装者（AI含む）へ

実装を始める前に **[CLAUDE.md](CLAUDE.md)** と `docs/04-development-rules.md` を必ず読んでください。
実装順序は `docs/15-roadmap.md` に定義されています。
