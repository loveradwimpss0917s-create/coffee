# 15. ロードマップ（MVP → β → v1.0 → v2.0）

各マイルストーンは「コミットしやすい粒度」のタスクに分割済み。**上から順に、1タスク=1PR** を原則とする。
Sonnet 5 はこの順序で実装すること（依存関係が順序に織り込まれている）。

## M0: 基盤（〜1週間相当）— コードより先に CI

| # | タスク | 参照設計 |
|---|---|---|
| 0-1 | pnpm workspace + ルート設定（biome/tsconfig/.nvmrc/.editorconfig/.gitignore） | docs/03 |
| 0-2 | ci.yml（lint/typecheck のみでまず green に） | docs/13 |
| 0-3 | packages/engine 雛形（schemas + version + 空 generate + Vitest 稼働） | docs/10 |
| 0-4 | apps/web 雛形（Next.js + OpenNext + wrangler dev で Hello が Workers 上で動く） | docs/03,13 |
| 0-5 | Tailwind v4 + デザイントークン + shadcn/ui 導入 + AppShell/タブバー | docs/05 |
| 0-6 | GitHub 設定（ブランチ保護・テンプレート）、Cloudflare Workers Builds 接続 | docs/13 |

**Exit 基準**: main への merge で workers.dev に自動デプロイされ、空のアプリシェルが表示される。

## M1: MVP — 「ゲストが1杯淹れて記録できる」（〜4週間相当）

エンジン（先行・並行可）:
| # | タスク |
|---|---|
| 1-1 | extraction.ts（TDS/EY/比率計算）+ プロパティテスト |
| 1-2 | temperature.ts / grind.ts + 単体テスト |
| 1-3 | ドリッパーデータ 5種（V60 / Switch / Kalita / Clever / AeroPress）+ template 関数 |
| 1-4 | グラインダーデータ 6種（KG521J-M, Comandante, 1Zpresso K-Ultra, Timemore C3, KINGrinder K6, generic）+ 変換 |
| 1-5 | adjustments.ts（味覚→パラメータ）+ pours.ts + Switch 3モード |
| 1-6 | explain（Rationale 生成）+ ゴールデンテスト 30 ケース |

UI:
| # | タスク |
|---|---|
| 1-7 | オンボーディング + 器具設定（S14/S10、localStorage） |
| 1-8 | 豆管理（S08/S09、LocalRepository） |
| 1-9 | ウィザード S02（4ステップ + TasteSliders + TasteRadar） |
| 1-10 | レシピ表示 S03（PourTimeline + GrindDisplay + Rationale） |
| 1-11 | タイマー S04（BrewTimerRing + Wake Lock + Switch 弁表示） |
| 1-12 | フィードバック S05 + ログ S06/S07（ローカル保存） |
| 1-13 | ホーム S01 + 設定 S12（テーマ切替） + E2E 中核ループ |
| 1-14 | **官能QA①**: KG521J-M 実測キャリブレーション + 主要レシピ実抽出 → 係数調整 |

**Exit 基準**: ゲストとして V60/Switch で好みを入れたレシピが生成され、タイマーで淹れ、ログが残る。E2E green。

## M2: β — アカウント・同期・フィードバックループ（〜4週間相当）

| # | タスク |
|---|---|
| 2-1 | packages/db + D1 マイグレーション + Better Auth（email, 匿名昇格） |
| 2-2 | Hono API（beans/recipes/brews/settings/gear）+ 統合テスト |
| 2-3 | ApiRepository + ゲストデータ import（/sync/import） |
| 2-4 | 保存レシピ S11 + 認証画面 S13 |
| 2-5 | 残りドリッパー 6種 + グラインダー 6種 |
| 2-6 | feedback.ts（adjustFromFeedback）+ 「前回の評価を反映」UI |
| 2-7 | Iced 対応（急冷テンプレート） |
| 2-8 | PWA（manifest + SW キャッシュ）/ レートリミット / Turnstile |
| 2-9 | 官能QA② + Release Please 導入 |

**Exit 基準**: アカウント同期・複数デバイス・全11器具・評価が次回レシピに反映される。限定ユーザーにβ公開。

## v1.0 — 公開品質（〜4週間相当）

- レシピ共有（/r/[shareId] + OGP 画像生成）
- i18n（en 追加、next-intl）/ アクセシビリティ監査（WCAG 2.2 AA）
- R2 豆写真 / Google・Apple ログイン
- 参照レシピ表示（大会・公式レシピ data/references、出典つき）
- Lighthouse CI / Sentry 検討 / 独自ドメイン
- 多点グラインダーキャリブレーション

## v2.0 — インテリジェンス & コミュニティ

- AI レシピ最適化・AI チャット相談（Claude API / Workers AI。engine の Zod スキーマを tool 定義に転用）
- 抽出履歴分析ダッシュボード（味覚傾向の可視化）
- Web Bluetooth スケール連携（Chrome/Android。iOS は Capacitor ラッパー判断）/ 温度計 / TDS メーター
- コミュニティ（公開レシピフィード・いいね）→ 書き込み規模次第で Durable Objects / Queues 導入
- ロースター公式レシピパートナーシップ

## リスクと前提（オーナーと合意すべき点）

1. **工数の単位は「相当」**: AI 実装のため実時間は短縮されるが、官能QA（実際に淹れる）は人間の実時間が必要
2. M1 の 1-14（実測キャリブレーション）はオーナーの協力が必須（KG521J-M の実機がクラウドにはないため）
3. エンジン係数の初期値は文献ベース。**β までに実抽出での検証を最低2周**行うことを品質ゲートとする
