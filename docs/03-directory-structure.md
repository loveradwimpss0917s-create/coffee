# 03. ディレクトリ構成・package構成・設定ファイル

## 1. リポジトリ全体

```
coffee/
├── .github/
│   ├── workflows/
│   │   └── ci.yml                 # lint / typecheck / test / build（全PR、デプロイはCloudflare Workers Builds担当）
│   ├── ISSUE_TEMPLATE/
│   │   ├── feature.md
│   │   └── bug.md
│   └── pull_request_template.md
├── apps/
│   └── web/                       # Next.js アプリ本体
├── packages/
│   ├── engine/                    # レシピ生成エンジン（純粋TS）
│   └── db/                        # Drizzle スキーマ・マイグレーション
├── docs/                          # 設計書（本ドキュメント群）
├── .editorconfig
├── .gitignore
├── .nvmrc                         # Node LTS 固定
├── biome.json                     # lint + format
├── package.json                   # ルート（scripts のみ、依存なし）
├── pnpm-workspace.yaml
├── CLAUDE.md
└── README.md
```

## 2. apps/web

```
apps/web/
├── public/                        # 静的アセット（アイコン・manifest）
├── src/
│   ├── app/                       # App Router（ルーティングのみ、ロジック禁止）
│   │   ├── (marketing)/           # 未ログインLP等（v1.0）
│   │   ├── (app)/                 # アプリ本体（認証任意）
│   │   │   ├── page.tsx           # ホーム
│   │   │   ├── brew/              # レシピ生成ウィザード
│   │   │   │   ├── page.tsx
│   │   │   │   ├── result/page.tsx
│   │   │   │   └── timer/page.tsx
│   │   │   ├── log/               # 抽出ログ
│   │   │   ├── beans/             # 豆管理
│   │   │   ├── gear/              # 器具設定
│   │   │   ├── recipes/           # 保存レシピ
│   │   │   ├── arrange/             # アレンジレシピ一覧（固定コンテンツ、docs/06 S16）
│   │   │   └── settings/
│   │   ├── auth/                  # サインイン・サインアップ
│   │   ├── api/
│   │   │   ├── v1/[[...route]]/route.ts   # Hono アプリをマウント
│   │   │   └── auth/[...all]/route.ts     # Better Auth ハンドラ
│   │   ├── layout.tsx
│   │   └── globals.css            # Tailwind + デザイントークン
│   ├── components/
│   │   ├── ui/                    # shadcn/ui（自動生成、手編集は最小限）
│   │   ├── layout/                # AppShell, TabBar, Header
│   │   ├── brew/                  # ウィザード・タイマー等の機能コンポーネント
│   │   ├── beans/
│   │   ├── log/
│   │   └── shared/                # 汎用（EmptyState, RatingStars 等）
│   ├── features/                  # 機能単位のロジック（hooks + queries + stores）
│   │   ├── brew/
│   │   │   ├── use-brew-wizard.ts # Zustand store
│   │   │   ├── use-brew-timer.ts
│   │   │   └── queries.ts         # TanStack Query 定義
│   │   ├── beans/
│   │   ├── log/
│   │   └── auth/
│   ├── server/                    # サーバー専用コード（"server-only" import）
│   │   ├── api/                   # Hono ルート定義
│   │   │   ├── index.ts           # app 組み立て
│   │   │   ├── recipes.ts
│   │   │   ├── brews.ts
│   │   │   ├── beans.ts
│   │   │   └── middleware/        # auth, rate-limit, error
│   │   ├── auth.ts                # Better Auth 設定
│   │   └── services/              # ビジネスロジック（route から分離）
│   ├── lib/                       # 汎用ユーティリティ（cn, formatters, storage）
│   └── i18n/                      # 文言辞書（MVPから文言は外部化）
│       └── ja.ts
├── e2e/                           # Playwright テスト
├── next.config.ts
├── open-next.config.ts
├── wrangler.jsonc                 # Workers / D1 / KV / R2 バインディング
├── tailwind.config.ts             # (v4はCSSベース設定、必要時のみ)
├── components.json                # shadcn/ui 設定
├── vitest.config.ts
├── playwright.config.ts
└── package.json
```

### レイヤ依存ルール（上→下のみ import 可）

```
app/ → components/ → features/ → lib/
app/(api) → server/ → packages/db, packages/engine
components/, features/ → packages/engine（型と生成関数の利用OK）
components/, features/ → server/ は禁止（"server-only" が守る）
```

## 3. packages/engine（最重要パッケージ）

```
packages/engine/
├── src/
│   ├── index.ts                   # 公開API（generateRecipe, adjustRecipe, schemas, data）
│   ├── schemas/                   # Zod スキーマ = 型の唯一の定義元
│   │   ├── input.ts               # BrewInput（豆・器具・好み）
│   │   ├── recipe.ts              # Recipe / RecipeStep / Rationale
│   │   └── taste.ts               # TasteProfile（5軸）
│   ├── core/
│   │   ├── generate.ts            # メインパイプライン
│   │   ├── extraction.ts          # TDS/EY/比率の計算モデル
│   │   ├── temperature.ts         # 湯温モデル
│   │   ├── grind.ts               # 粒度モデル（μm→目盛変換）
│   │   ├── pours.ts               # 注湯スケジュール生成
│   │   ├── adjustments.ts         # 味覚→パラメータ調整ルール
│   │   └── feedback.ts            # 履歴フィードバック補正（β）
│   ├── data/                      # 器具マスタ（コード外データ）
│   │   ├── drippers/              # 1ドリッパー = 1ファイル
│   │   │   ├── hario-v60.ts
│   │   │   ├── hario-switch.ts
│   │   │   └── ...
│   │   ├── grinders/              # 1グラインダー = 1ファイル
│   │   │   ├── comandante-c40.ts
│   │   │   ├── delonghi-kg521.ts
│   │   │   └── ...
│   │   └── references/            # 参照レシピ（大会・ロースター）出典つき
│   └── version.ts                 # ENGINE_VERSION（semver）
├── test/
│   ├── golden/                    # ゴールデンテスト（入力→期待レシピのスナップショット）
│   ├── properties/                # 物性テスト（不変条件）
│   └── unit/
├── package.json                   # dependencies: zod のみ（厳守）
└── tsconfig.json
```

## 4. packages/db

```
packages/db/
├── src/
│   ├── schema/                    # Drizzle スキーマ（docs/07 準拠）
│   │   ├── auth.ts                # Better Auth テーブル
│   │   ├── beans.ts
│   │   ├── recipes.ts
│   │   ├── brews.ts
│   │   └── index.ts
│   ├── index.ts                   # createDb(d1) ファクトリ
│   └── seed/                      # 開発用シードデータ
├── migrations/                    # drizzle-kit 生成 SQL（コミット対象）
├── drizzle.config.ts
└── package.json
```

## 5. ルート設定ファイル（内容仕様）

### pnpm-workspace.yaml
```yaml
packages:
  - apps/*
  - packages/*
```

### package.json（ルート）
```jsonc
{
  "name": "coffee-recipe-lab",
  "private": true,
  "packageManager": "pnpm@10.x", // corepack で固定
  "scripts": {
    "dev": "pnpm --filter web dev",
    "build": "pnpm -r build",
    "lint": "biome check .",
    "lint:fix": "biome check --write .",
    "typecheck": "pnpm -r typecheck",
    "test": "pnpm -r test",
    "test:e2e": "pnpm --filter web test:e2e",
    "db:generate": "pnpm --filter @coffee-lab/db generate",
    "db:migrate:local": "pnpm --filter web exec wrangler d1 migrations apply DB --local",
    "db:migrate:prod": "pnpm --filter web exec wrangler d1 migrations apply DB --remote"
  }
}
```

### biome.json（方針）
- formatter: インデント2スペース・シングルクォート・セミコロンあり・行幅100
- linter: `recommended` + `nursery/useSortedClasses`（Tailwind クラス順）
- `noExplicitAny: error` / `noUnusedImports: error`
- domains: react, next 有効化

### wrangler.jsonc（apps/web、骨子）
```jsonc
{
  "name": "coffee-recipe-lab",
  "main": ".open-next/worker.js",
  "compatibility_date": "2026-06-01",
  "compatibility_flags": ["nodejs_compat"],
  "assets": { "directory": ".open-next/assets", "binding": "ASSETS" },
  "d1_databases": [{ "binding": "DB", "database_name": "coffee-lab", "database_id": "<prod-id>", "migrations_dir": "../../packages/db/migrations" }],
  "kv_namespaces": [{ "binding": "KV", "id": "<prod-id>" }],
  "r2_buckets": [{ "binding": "R2", "bucket_name": "coffee-lab-media" }],
  "observability": { "enabled": true },
  "env": {
    "preview": { /* preview 用 D1/KV を別ID で定義 */ }
  }
}
```

### tsconfig（方針）
- ルートに `tsconfig.base.json`: `strict: true`, `noUncheckedIndexedAccess: true`,
  `exactOptionalPropertyTypes: true`, `verbatimModuleSyntax: true`, `moduleResolution: "bundler"`
- 各パッケージが extends。パスエイリアス: web 内は `@/*`、パッケージは `@coffee-lab/engine` / `@coffee-lab/db`

### .nvmrc
```
22
```

## 6. package 命名

| パッケージ | npm name |
|---|---|
| apps/web | `web`（private） |
| packages/engine | `@coffee-lab/engine` |
| packages/db | `@coffee-lab/db` |

将来追加の目安: `@coffee-lab/ble`（デバイス連携）、`@coffee-lab/ai`（AI最適化）、`apps/worker-jobs`（Queues consumer）。
