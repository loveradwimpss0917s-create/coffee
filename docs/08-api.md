# 08. API設計

## 1. 方針

- **Hono** を Next.js Route Handler（`/api/v1/[[...route]]`）にマウント。ベースパス `/api/v1`
- すべての入出力を Zod で検証（`@hono/zod-validator`）。スキーマは `packages/engine` / `packages/db` の型を再利用
- **レシピ生成はクライアントで実行**するため、生成APIは基本不要。API の責務は「永続化・同期・認証」
  - 例外: `/recipes/generate` をサーバー側にも用意（将来の AI 最適化・外部公開・共有ページの再現用）。中身は同一エンジン
- 認証: Better Auth のセッション Cookie。API は `requireAuth` ミドルウェアで保護（公開エンドポイントを除く）
- Hono RPC（`hc<AppType>`）でクライアントに型を供給。fetch ラッパーは書かない

## 2. 共通仕様

### レスポンス形式
```jsonc
// 成功: データをそのまま返す（envelope なし）
{ "id": "rcp_...", ... }
// 一覧: カーソルページネーション
{ "items": [...], "nextCursor": "..." | null }
// エラー: RFC 9457 Problem Details 風
{ "type": "validation_error", "title": "入力が不正です", "status": 400, "errors": [{ "path": "doseG", "message": "..." }] }
```

### エラーコード
| status | type | 用途 |
|---|---|---|
| 400 | validation_error | Zod 失敗 |
| 401 | unauthorized | 未認証 |
| 403 | forbidden | 他人のリソース |
| 404 | not_found | |
| 409 | conflict | 同期の重複等 |
| 429 | rate_limited | KV レートリミット |
| 500 | internal | 詳細はログのみ（クライアントに漏らさない） |

### 共通ミドルウェア（適用順）
`requestId → logger → rateLimit(KV) → auth（セッション解決） → zValidator → handler`

## 3. エンドポイント一覧

### 認証（Better Auth が自動提供: `/api/auth/*`）
MVP/β では email+password と匿名昇格のみ実装（2-1）。Google/Apple ログインは v1.0 で追加する（docs/15）。

### Beans（実装済み、2-2）
| Method | Path | 説明 |
|---|---|---|
| GET | `/beans?cursor&archived` | 自分の豆一覧 |
| POST | `/beans` | 作成 |
| GET/PATCH/DELETE | `/beans/:id` | 詳細・更新・削除 |

### Recipes（実装済み、2-2。共有関連は未実装）
| Method | Path | 説明 |
|---|---|---|
| GET | `/recipes?cursor&dripperId` | 保存レシピ一覧 |
| POST | `/recipes` | 保存（input/output を受領。**サーバーで input から output を再生成し、常にサーバー生成分を保存** — 改竄防止） |
| GET/PATCH/DELETE | `/recipes/:id` | 詳細（title のみ PATCH 可。visibility の変更は共有機能と合わせて v1.0） |
| POST | `/recipes/generate` | サーバー側生成（body: BrewInput → Recipe）。未認証可。レートリミットは 2-8 で追加 |
| GET | `/r/:shareId` | 公開レシピ取得（v1.0、未実装。DB の visibility/share_id カラムは先行追加済み） |

### Brews（実装済み、2-2）
| Method | Path | 説明 |
|---|---|---|
| GET | `/brews?cursor&beanId` | 抽出ログ一覧 |
| POST | `/brews` | 抽出記録 + フィードバック保存 |
| GET/PATCH/DELETE | `/brews/:id` | 詳細（rating/tasteFeedback/notes/tds/actualTimeSec が PATCH 可） |

### Settings（実装済み、2-2）／ Gear（v1.0）
| Method | Path | 説明 |
|---|---|---|
| GET/PUT | `/settings` | user_settings 全体（グラインダー1台分のキャリブレーションを含む、docs/07 §3.2） |
| GET/POST/PATCH/DELETE | `/gear/grinders(/:id)` | user_grinders CRUD。複数グラインダー個別キャリブレーションは v1.0（docs/07 §3.3, docs/15） |

### Sync（ゲスト→アカウント移行）
| Method | Path | 説明 |
|---|---|---|
| POST | `/sync/import` | ゲスト localStorage データ一括取込（beans/recipes/brews）。Zod 版付き envelope、最大 500KB、冪等（クライアント生成の importId で重複防止） |

### Master data
器具マスタは engine パッケージに同梱されるため **API 不要**（クライアントに常に存在）。
将来コミュニティ投稿の器具データを扱う場合のみ `/gear/catalog` を追加。

## 4. バリデーション境界の原則

```
クライアント: form → zodResolver(brewInputSchema) → engine
サーバー:     request body → zValidator(同一スキーマ) → service → db
```
- 同じ Zod スキーマ（engine/db パッケージ由来）を両側で使う。**スキーマの二重定義禁止**
- DB から読んだ JSON カラムも parse する（`recipeSchema.parse(row.output)`）。engine_version が古い場合は
  `migrateRecipeJson()`（engine が提供するアップキャスト関数）を通す

## 5. レートリミット（KV）

| 対象 | 制限 |
|---|---|
| `/recipes/generate`（未認証） | 20 req / 10min / IP |
| 認証系（sign-in 等） | Better Auth 内蔵 + 10 req / 10min / IP |
| その他認証済み API | 120 req / min / user |

実装: KV に `rl:{scope}:{key}` を TTL 付きカウンタで（β で Durable Objects Rate Limiter に置換検討）。

## 6. バージョニング

- パスの `/v1` は互換性を破る時のみ増やす（追加フィールドは非破壊とみなす）
- OpenAPI ドキュメントは β で `@hono/zod-openapi` へ移行して自動生成（MVP では型共有で十分）
