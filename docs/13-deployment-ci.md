# 13. Cloudflare デプロイ設計・GitHub Actions / CI 戦略

## 1. デプロイ形態

- **Cloudflare Workers**（Pages は不採用 — Workers が現行の推奨。static assets は Workers Assets で配信）
- ビルド: `next build` → `opennextjs-cloudflare build` → `.open-next/` を `wrangler deploy`
- 環境は 2 面 + ローカル:

| 環境 | トリガ | Worker | D1 / KV / R2 |
|---|---|---|---|
| local | 開発者 | `wrangler dev`（miniflare） | ローカルエミュレート |
| preview | PR | `wrangler versions upload` の **preview URL**（`<hash>-coffee-recipe-lab.workers.dev`） | preview 用 D1/KV（`env.preview`） |
| production | main へ merge | `coffee-recipe-lab` | 本番リソース |

- ドメイン: 当面 `*.workers.dev` → 独自ドメイン取得後に Custom Domain を張る（コード変更不要）
- ロールバック: `wrangler rollback`（直前バージョンへ即時）。D1 マイグレーションは前方互換を保つ運用（docs/07 §4）なのでコードのみ戻して安全

## 2. GitHub Actions ワークフロー

### ci.yml（全 PR / main push）
```yaml
jobs:
  ci:
    steps:
      - checkout / pnpm + Node 22 setup（corepack, キャッシュ）
      - pnpm install --frozen-lockfile
      - pnpm lint          # Biome
      - pnpm typecheck     # 全パッケージ tsc --noEmit
      - pnpm test          # Vitest（engine + web unit）
      - pnpm build         # next build + opennext（バンドルサイズを artifact 化し、
                           #  worker サイズが閾値(gzip 3MB)超過で警告）
  e2e:                     # main と label 付き PR のみ（時間節約）
    steps: [build 後に playwright test（wrangler dev 起動に対して実行）]
```

### preview.yml（PR、fork からは実行しない）
```yaml
- ci 成功後: opennextjs-cloudflare build
- wrangler versions upload --env preview → preview URL を PR にコメント
- preview D1 に migrations apply（--env preview）
```

### deploy.yml（main push、concurrency: production で直列化）
```yaml
1. ci と同一チェックを再実行（または ci の成功を required に）
2. wrangler d1 migrations apply DB --remote        # デプロイ前にマイグレーション
3. opennextjs-cloudflare build && wrangler deploy
4. デプロイ後スモーク: /api/v1/health を curl（失敗で rollback 通知）
```

### 運用ルール
- main は required checks（ci）+ 直 push 禁止。デプロイは main merge のみ = **継続的デプロイ**
- リリースノート: Release Please（Conventional Commits から CHANGELOG / タグ自動生成）を β から導入
- Secrets: `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`（最小権限トークン、docs/12 §6）

## 3. ローカル開発フロー

```bash
pnpm dev                       # next dev（Turbopack）。CF バインディングは
                               # @opennextjs/cloudflare の getCloudflareContext + wrangler proxy 経由
pnpm preview                   # opennext build + wrangler dev（本番同等ランタイム検証）
pnpm db:migrate:local          # ローカル D1 へ適用
```
- 原則 `pnpm dev` で開発し、Workers 固有機能（KV/D1/R2）に触れた PR は `pnpm preview` での動作確認を PR チェックリストに含める

## 4. パフォーマンス予算（CI で監視）

| 指標 | 予算 |
|---|---|
| Worker バンドル（gzip） | < 3MB（警告）/ < 10MB（CF 上限に対する fail） |
| 初回 JS（クライアント） | < 250KB gzip |
| LCP（モバイル 4G, Lighthouse CI は v1.0 で導入） | < 2.0s |

## 5. 監視・運用

- `observability.enabled = true`（Workers Logs + Invocation logs）
- `/api/v1/health`: D1/KV への疎通を含むヘルスチェック
- Cloudflare の Analytics（リクエスト数・エラー率・CPU 時間）を週次確認。Workers Paid 移行判断の材料に
