# 12. セキュリティ設計

## 1. 脅威モデル（要約）

扱うデータは低機密（メール・コーヒーの嗜好データ）だが、アカウント乗っ取り・スパム・
インフラ悪用（生成APIの濫用）を防ぐ。決済情報・住所等は扱わない（当面）。

## 2. 認証・セッション（Better Auth）

- 方式: Email+Password / Google / Apple（β）。匿名セッション（ゲスト昇格用）
- パスワード: Better Auth 既定（scrypt）。最小8文字 + 漏洩パスワードチェックは v1.0 で検討
- セッション: HttpOnly / Secure / SameSite=Lax Cookie。KV セッションストア、有効 30日・ローリング更新
- サインアップに Cloudflare **Turnstile**（bot 対策、β）
- レート制限: 認証系 10 req/10min/IP（docs/08 §5）
- アカウント削除: 自己サービスで即時 CASCADE 物理削除（GDPR/APPI 配慮）

## 3. 入力検証・インジェクション対策

- **全 API 境界で Zod parse**（docs/08 §4）。JSON カラムも読み出し時に parse
- SQL: Drizzle のパラメタライズドクエリのみ。生SQL・文字列結合禁止
- XSS: React の自動エスケープ + `dangerouslySetInnerHTML` 禁止（Biome ルールで検出）。
  ユーザー入力（豆名・メモ）は表示時プレーンテキストのみ
- 共有ページ（/r/[shareId]）: shareId は 128bit nanoid（推測不能）。OGP 画像生成時も入力をサニタイズ

## 4. HTTP セキュリティヘッダ（middleware で全応答に付与）

```
Content-Security-Policy: default-src 'self'; script-src 'self' 'wasm-unsafe-eval';
  style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: https://<R2公開ドメイン>;
  connect-src 'self'; frame-ancestors 'none'
Strict-Transport-Security: max-age=31536000; includeSubDomains
X-Content-Type-Options: nosniff
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: bluetooth=(self)   // 将来の Web Bluetooth 用に self のみ
```
Next.js の inline script 事情で CSP は nonce 方式を実装時に検証（OpenNext 環境での nonce 対応可否を M1 で確認）。

## 5. CSRF / CORS

- 変更系 API は SameSite=Lax + Origin ヘッダ検証（Hono middleware）。Better Auth は内蔵 CSRF 保護
- CORS: 既定で同一オリジンのみ。API 公開（v2.0）まで `Access-Control-Allow-Origin` を出さない

## 6. シークレット管理

- `wrangler secret` / GitHub Actions Secrets のみ。リポジトリに一切コミットしない
- `.dev.vars`（ローカル）は .gitignore 済み。`.dev.vars.example` をコミットしてキー名を文書化
- 必要なシークレット: `BETTER_AUTH_SECRET`, OAuth client secrets, （将来）`ANTHROPIC_API_KEY`
- CI: GitHub OIDC は Cloudflare 未対応のため API Token（最小権限: 対象アカウントの Workers/D1 のみ）を使用し、90日ローテーション

## 7. R2 画像アップロード（β）

- 直接アップロードは presigned URL 方式。Content-Type / サイズ（5MB）検証、拡張子ホワイトリスト（jpg/png/webp/heic）
- 配信は R2 public bucket + Cloudflare Images transform（リサイズ）。オリジナルは非公開バケット

## 8. 依存関係・サプライチェーン

- Renovate で週次更新 PR（patch は自動マージ、minor/major は手動）
- `pnpm audit` を CI に組込み（high 以上で fail）
- lockfile 必須（`--frozen-lockfile`）。install scripts は pnpm 既定でブロック、許可リスト管理

## 9. ログ・監視

- Workers Logs（observability 有効化済み）。ログに PII（メール）とセッショントークンを出さない規約
- エラー通知: Workers Logs のアラート（error rate）→ メール。Sentry は v1.0 で検討
- 監査: 認証イベント（sign-in 失敗等）は Better Auth のログで追跡可能に
