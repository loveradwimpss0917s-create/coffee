# 04. 開発ルール（命名規則・Git運用・ブランチ戦略・コーディング規約）

## 1. 命名規則

### 1.1 ファイル・ディレクトリ

| 対象 | 規則 | 例 |
|---|---|---|
| ディレクトリ | kebab-case | `brew-timer/` |
| コンポーネントファイル | kebab-case | `brew-timer.tsx`（export は `BrewTimer`） |
| hooks | `use-` プレフィックス | `use-brew-wizard.ts` |
| ユーティリティ / データ | kebab-case | `format-weight.ts`, `hario-v60.ts` |
| テスト | 対象名 + `.test.ts` | `generate.test.ts`（対象の隣 or `test/`） |
| Zod スキーマファイル | 単数形 | `recipe.ts` |

### 1.2 コード内

| 対象 | 規則 | 例 |
|---|---|---|
| 型・インターフェース・コンポーネント | PascalCase | `BrewInput`, `RecipeStep` |
| 変数・関数 | camelCase | `generateRecipe` |
| 定数（真にグローバルな不変値のみ） | SCREAMING_SNAKE | `ENGINE_VERSION` |
| Zod スキーマ | `xxxSchema` | `brewInputSchema`（型は `z.infer` で `BrewInput`） |
| boolean | is/has/can/should | `isIced`, `hasBloom` |
| イベントハンドラ | `handle` + 対象 + 動詞 / props は `on` | `handlePourComplete` / `onStepChange` |
| DB テーブル | snake_case 複数形 | `brew_feedbacks` ではなく `brews` + カラムで表現 |
| DB カラム | snake_case | `roast_level`, `created_at` |
| API パス | kebab-case 複数形 | `/api/v1/recipes`, `/api/v1/brews` |
| ID | プレフィックス付き nanoid | `rcp_x7Kd9...`, `brw_...`, `ben_...`（デバッグ性向上） |

### 1.3 ドメイン用語統一（ユビキタス言語）

| 用語 | コード上 | 意味 |
|---|---|---|
| 豆 | `bean` | ユーザーが登録した豆 |
| 焙煎度 | `roastLevel` | `light / medium-light / medium / medium-dark / dark` の5段階 |
| 精製方法 | `process` | `washed / natural / honey / anaerobic / other` |
| ドリッパー | `dripper` | 抽出器具（AeroPress 等も便宜上 dripper） |
| 粒度 | `grindSize`（μm）/ `grindSetting`（目盛） | 必ず両方を区別する |
| 注湯 | `pour` | 1回の注ぎ |
| 蒸らし | `bloom` | — |
| 抽出 | `brew` | 1回の抽出実行（ログの単位） |
| レシピ | `recipe` | エンジンが生成した手順一式 |
| 味覚プロファイル | `tasteProfile` | 5軸の好み/評価ベクトル |

## 2. Git 運用・ブランチ戦略

### 2.1 ブランチ戦略: トランクベース（GitHub Flow）

```
main ──────●────●────●──→ 常にデプロイ可能。push 禁止（PR のみ）
            \feat/xxx ●─PR→ squash merge
```

- **main**: 保護ブランチ。CI 必須・レビュー1件必須（AI実装時はオーナーレビュー）・force-push 禁止
- **作業ブランチ**: `<type>/<短い説明>` 例: `feat/brew-wizard`, `fix/grind-conversion`, `docs/api-spec`
- 生存期間は最長3日を目安。長引くタスクは分割する
- **リリース**: main への merge = 本番デプロイ（docs/13）。リリースブランチは作らない
- タグ: `v0.1.0` 形式（semver）。エンジンは独立して `engine-v1.2.0` タグを持つ

### 2.2 コミット規約: Conventional Commits

```
<type>(<scope>): <説明（日本語可）>

type: feat | fix | docs | refactor | test | chore | perf | ci
scope: engine | web | db | deps など（省略可）
```

例: `feat(engine): HARIO Switch の弁スケジュール生成を追加`

- 1コミット = 1論理変更。「動く状態」でコミット
- PR は squash merge のみ → PR タイトルも Conventional Commits 形式にする

### 2.3 PR ルール

- 1 PR = 1 関心事、目安 ±400行以内（自動生成コード除く）
- PR テンプレート: 目的 / 変更内容 / 設計書との対応（`docs/XX §Y`） / テスト方法 / スクリーンショット（UI変更時）
- 設計変更を伴う場合は **docs/ の更新を同一 PR に含める**

## 3. コーディング規約

Biome の設定（docs/03 §5）で機械的に強制できるものはツールに任せる。以下は設計判断を含むルール。

### 3.1 TypeScript

- `strict` + `noUncheckedIndexedAccess` + `exactOptionalPropertyTypes` 前提で書く
- `any` 禁止。外部入力は `unknown` で受けて Zod で parse
- 型は **Zod スキーマから `z.infer` で導出**（スキーマが唯一の定義元）。手書き型とスキーマの二重管理禁止
- ユニオンは文字列リテラルで（enum 禁止）: `type RoastLevel = 'light' | 'medium-light' | ...`
- 関数は原則 named export。default export は Next.js の規約ファイル（page.tsx 等）のみ
- エラー: エンジンは `Result` を返さず **throw しない設計**（入力を clamp して常に生成 + `warnings[]` を返す）。API 層は Hono のエラーハンドラで統一（docs/08）
- 数値の単位はコメントでなく命名で表現: `waterG`, `tempC`, `timeSec`, `grindMicron`

### 3.2 React / Next.js

- Server Components をデフォルトに。`'use client'` は interactivity が必要な葉に限定
- ロジックを持つコンポーネントは「ロジック（hooks）とビュー」を分離し hooks を単体テスト
- props drilling が3階層を超えたら composition か store を検討
- `useEffect` は「外部システムとの同期」のみ。データ取得は TanStack Query / RSC
- 文言はハードコード禁止 → `src/i18n/ja.ts` に定義（将来の en 追加を無コストに）

### 3.3 スタイル

- Tailwind ユーティリティのみ。任意値（`w-[13px]`）はデザイントークンにない値の使用を意味するので原則禁止
- 色・余白・radius は必ずトークン経由（docs/05）。`#hex` 直書き禁止
- 条件付きクラスは `cn()`（clsx + tailwind-merge）

### 3.4 コメント・ドキュメント

- **エンジンの係数・ルールには必ず出典コメント**を付ける（例: `// SCA Golden Cup: EY 18–22%`）
- JSDoc は公開 API（packages の export）に必須、内部関数は「なぜ」がある場合のみ
- TODO は `// TODO(#issue番号):` 形式のみ許可

### 3.5 依存関係の追加ルール

- 追加前チェック: (1) 標準/既存依存で書けないか (2) Workers で動くか (3) メンテ状況 (4) バンドルサイズ
- `packages/engine` への依存追加は **zod 以外禁止**（設計原則）
- 追加時は PR 説明に理由を明記
