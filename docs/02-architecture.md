# 02. プロジェクト全体設計書・技術選定

## 1. プロダクトビジョン

**「味から逆算する」**: ユーザーは完成した味（酸味・甘さ・ボディ…）と手持ちの道具・豆を入力し、
アプリが抽出理論に基づいてレシピ（粉量・湯量・温度・粒度・注湯スケジュール）を動的に生成する。

### 対象ユーザー
1. ホームバリスタ（メイン）: 手持ち器具で好みの味を安定して出したい
2. スペシャルティ愛好家: 豆ごとの最適解を探索したい
3. 競技者・プロ: パラメータの根拠と微調整機能を求める

### プロダクト原則
- **説明可能性**: 生成されたレシピの各パラメータに「なぜその値か」の根拠を表示する
- **決定論**: 同じ入力からは同じレシピ（乱数なし）。信頼と再現性の基盤
- **個人化**: 抽出後のフィードバックで次回レシピが改善される（β以降）
- **オフラインファースト**: レシピ生成はクライアントで完結（ゲスト利用可）

## 2. アーキテクチャ全体像

```
┌─────────────────────────────────────────────────────────┐
│ ブラウザ (PWA)                                            │
│  Next.js App Router (RSC + Client Components)            │
│  ┌─────────────────────────────────────────────┐        │
│  │ @coffee-lab/engine（レシピ生成・純粋TS）        │ ← クライアントで実行
│  └─────────────────────────────────────────────┘        │
└──────────────┬──────────────────────────────────────────┘
               │ HTTPS (REST /api/v1, Hono)
┌──────────────▼──────────────────────────────────────────┐
│ Cloudflare Workers（OpenNext）                            │
│  ├ Next.js SSR / Route Handlers                          │
│  ├ Hono API (/api/v1/*)  — Zod validation                │
│  ├ Better Auth（セッション: KV）                          │
│  └ @coffee-lab/engine（サーバー側でも同一エンジン実行可）    │
├──────────────────────────────────────────────────────────┤
│ D1 (SQLite)      : ユーザー・豆・レシピ・抽出ログ           │
│ KV               : セッション・レートリミット・マスタキャッシュ │
│ R2               : 豆写真・アバター画像                     │
│ (将来) Queues     : 分析集計 / Workers AI: AI最適化         │
└──────────────────────────────────────────────────────────┘
```

### 設計上の最重要判断: エンジンの分離

レシピ生成エンジン（`packages/engine`）は **フレームワーク非依存の純粋 TypeScript パッケージ**とする。

- **理由**: エンジンがこのプロダクトのコアIP。UIフレームワークの寿命（5年）よりエンジンの寿命（10年+）が長い
- クライアント・サーバー両方で同一コードを実行（ゲストはオフライン生成、ログイン時はサーバー保存）
- 100% ユニットテスト可能（DOM・DB・ネットワーク不要）
- 将来の展開が容易: ネイティブアプリ、CLI、MCPサーバー、API公開

## 3. 技術選定と理由

### 3.1 確定スタック

| レイヤ | 採用 | バージョン方針 |
|---|---|---|
| ランタイム | Cloudflare Workers | — |
| フレームワーク | **Next.js (App Router) + @opennextjs/cloudflare** | Next 15 系（16 は adapter 安定確認後） |
| 言語 | TypeScript strict | 5.x 最新 |
| スタイル | Tailwind CSS v4 | — |
| UIコンポーネント | shadcn/ui (Radix UI) | copy-in 方式 |
| アニメーション | Motion (旧 framer-motion) | — |
| DB | Cloudflare D1 + **Drizzle ORM** | — |
| KVS | Cloudflare KV | セッション・キャッシュ・レートリミット |
| オブジェクトストレージ | Cloudflare R2 | 画像（β以降） |
| 認証 | **Better Auth** | — |
| APIレイヤ | **Hono**（Next Route Handler 内にマウント） | zod-validator |
| スキーマ検証 | Zod | v4 |
| サーバー状態 | TanStack Query v5 | — |
| クライアント状態 | Zustand v5 | 抽出ウィザード・タイマーのみ |
| フォーム | react-hook-form + Zod resolver | — |
| Lint/Format | **Biome** | ESLint+Prettier は不採用 |
| テスト | Vitest + Playwright | @cloudflare/vitest-pool-workers |
| パッケージ管理 | pnpm workspace | corepack 固定 |
| CI/CD | GitHub Actions + wrangler | — |

### 3.2 主要な選定理由・トレードオフ

#### Next.js + OpenNext（vs React Router v7 / Hono+Vite SPA / Astro）

- **採用理由**
  - OpenNext Cloudflare adapter は 1.0 GA（2026）で、Cloudflare が公式に推奨する Next.js デプロイ方法
  - shadcn/ui・エコシステム・ドキュメント量が最大 → **Sonnet 5 による実装効率が最も高い**
  - RSC によりマスタデータ（ドリッパー一覧等）の配信が軽量
  - 将来の SEO 面（公開レシピページ、コミュニティ）で SSR が必須
- **デメリットと緩和**
  - Workers 上の Next.js はバンドルが大きくなりがち → CI でサイズ監視、Server Components 中心の設計
  - Node API の一部非対応 → `nodejs_compat` フラグ + 依存追加時に互換性確認をルール化
- **代替案**: React Router v7 は Workers ネイティブで軽量だが、エコシステムと実装資料の厚みで Next.js が優位。
  SPA (Hono+Vite) は SEO・共有URLの要件（将来のレシピ共有）で不利

#### Cloudflare Pages を使わない理由

Cloudflare は現在 **Workers（static assets 対応）を推奨**しており、Pages は新機能開発が停止している。
新規プロジェクトで Pages を選ぶ理由はない。

#### Better Auth（vs Auth.js）

- Auth.js (NextAuth v5) は開発が停滞気味で、D1/Drizzle との統合に癖がある
- Better Auth は Drizzle adapter・匿名ユーザー・Passkey・組織機能をプラグインで持ち、Cloudflare Workers 動作実績が豊富
- **匿名セッション → 本登録への昇格**（ゲストのローカルデータ引き継ぎ）が組み込みでサポートされる点が決定打

#### Drizzle（vs Prisma）

- D1 への対応成熟度・エッジランタイムでの軽さ・SQLファーストなマイグレーションで Drizzle が優位
- Prisma の D1 対応は driver adapter 経由で余分なランタイムを持ち込む

#### Biome（vs ESLint + Prettier）

- 単一ツールで lint + format、設定が1ファイル、CI が高速
- **デメリット**: ESLint プラグイン資産（react-hooks 等）の一部が使えない → Biome の domain ルール（react 推奨セット）で代替

#### 状態管理: Zustand + TanStack Query（vs Redux / Jotai）

- サーバー状態とクライアント状態を明確に分離（docs/09）
- グローバル状態は「抽出ウィザード」「進行中タイマー」のみで小さい。Redux は過剰

### 3.3 モノレポ（pnpm workspace）

```
apps/web           → UI・API（Next.js）
packages/engine    → レシピ生成エンジン（依存: zod のみ）
packages/db        → Drizzle スキーマ・マイグレーション（web と将来の worker が共有）
```

- **理由**: エンジンの独立性を「ディレクトリ規約」でなく「パッケージ境界」で強制する。
  `packages/engine/package.json` の dependencies に zod 以外を追加できない構造にする
- Turborepo は現段階では不採用（3パッケージでは過剰）。pnpm の `--filter` で十分。パッケージが5+になったら導入

## 4. データフロー（代表ユースケース）

### レシピ生成（ゲスト・オフライン可）
```
入力フォーム → Zod parse → engine.generateRecipe(input) → Recipe（根拠つき）
→ 画面表示 / localStorage 保存（ゲスト） / POST /api/v1/recipes（ログイン時）
```

### 抽出フィードバックループ（β以降）
```
抽出実行（タイマー） → 味の評価入力（5軸） → POST /api/v1/brews
→ 次回生成時: engine.generateRecipe(input, { history }) が評価を反映
  （例: 「苦い」評価 → 同条件の次回レシピは湯温 -2°C / 粒度 +1step）
```

## 5. 非機能要件

| 項目 | 目標 |
|---|---|
| パフォーマンス | LCP < 2.0s (4G) / レシピ生成 < 50ms（クライアント） |
| 可用性 | Cloudflare エッジ依存（SLA 準拠）。エンジンはオフライン動作 |
| スケール | 想定 5万 MAU。D1 読み取り中心 + KV キャッシュで吸収（docs/07 §7） |
| アクセシビリティ | WCAG 2.2 AA（docs/05） |
| 国際化 | MVP は ja のみ。構造は next-intl 前提で文言を外部化（v1.0 で en） |
| 対応環境 | iOS/Android 最新2バージョンのブラウザ、Chrome/Safari/Firefox/Edge 最新2バージョン |

## 6. 将来拡張のための設計フック

| 将来機能 | 今の設計での備え |
|---|---|
| AIレシピ最適化 / AIチャット | エンジン入出力が Zod スキーマ化済 → そのまま LLM の tool 定義に転用。Workers AI or Claude API |
| Bluetooth スケール/温度計/TDS | `DeviceProvider` インターフェースを UI 層に定義（実装は v2.0）。タイマー画面は「手動進行」と「センサー進行」を差し替え可能に |
| コミュニティ / レシピ共有 | recipes テーブルに `visibility` カラムを最初から用意。公開URLは `/r/[shareId]` を予約 |
| ロースター公式・大会レシピ | `recipe_sources` テーブル（provenance 管理）を v1.0 で追加。エンジンの「参照レシピブレンド」機構（docs/10 §8） |
| 抽出履歴分析 | brews テーブルに構造化評価（5軸+TDS）を最初から保存。集計は将来 Queues + 集計テーブル |

## 7. 既知の制約（正直に）

- **Web Bluetooth は iOS Safari 非対応** → iOS でのスケール連携はネイティブラッパー（Capacitor）が必要。v2.0 の検討事項とし、Web 層はデバイス抽象化のみ行う
- D1 は単一プライマリ書き込み → 書き込み heavy な機能（リアルタイムコミュニティ等）は Durable Objects を将来検討
- 官能評価は主観であり、エンジンは「良い出発点」を提供するものと位置づける（UI 上も断定表現を避ける）
