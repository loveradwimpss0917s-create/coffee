# 13. Cloudflare デプロイ設計・CI 戦略

## 1. デプロイ形態

- **Cloudflare Workers**（Pages は不採用 — Workers が現行の推奨。static assets は Workers Assets で配信）
- ビルド: `next build` → `opennextjs-cloudflare build` → `.open-next/` を `wrangler deploy`
- **デプロイの主経路は Cloudflare Workers Builds（Git連携によるネイティブCI/CD）**。
  GitHub Actions 側で API トークンを発行・管理する必要がなく、GitHubユーザーにとって最小セットアップで済むため採用（Cloudflare公式もこの構成を推奨）
- 環境は 2 面 + ローカル:

| 環境 | トリガ | Worker | D1 / KV / R2 |
|---|---|---|---|
| local | 開発者 | `wrangler dev`（miniflare） | ローカルエミュレート |
| preview | 非production branchのpush（Workers Builds の non-production branch build） | `wrangler versions upload` の preview URL | preview 用 D1/KV（`env.preview`、M2以降） |
| production | main へ merge | `coffee-recipe-lab` | 本番リソース |

- ドメイン: 当面 `*.workers.dev` → 独自ドメイン取得後に Custom Domain を張る（コード変更不要）
- ロールバック: `wrangler rollback`（直前バージョンへ即時）。D1 マイグレーションは前方互換を保つ運用（docs/07 §4）なのでコードのみ戻して安全

## 2. Cloudflare Workers Builds（デプロイ）

Cloudflare ダッシュボード（Workers & Pages → Import a repository）でリポジトリを接続して設定する。
モノレポ構成のため以下の設定が必須:

| 項目 | 設定値 |
|---|---|
| Project name（Worker名） | `coffee-recipe-lab`（`apps/web/wrangler.jsonc` の `name` と一致必須。不一致だとビルド失敗） |
| Production branch | `main` |
| Root directory | `apps/web` |
| Build command | `pnpm exec opennextjs-cloudflare build` |
| Deploy command | `pnpm exec wrangler deploy` |
| Non-production branch build | 有効化（PR/フィーチャーブランチのプレビュー確認用） |

- Node バージョンは `.nvmrc`（22）を参照。認識しない場合はダッシュボードの Build variables で `NODE_VERSION=22` を明示
- D1/KV/R2 バインディング導入後（M2）は、マイグレーション適用ステップを別途 Deploy command 前段に追加する
  （例: `pnpm --filter web exec wrangler d1 migrations apply DB --remote && pnpm exec wrangler deploy`）
- Secrets/環境変数はダッシュボードの Settings → Variables & Secrets で管理（docs/12 §6 の最小権限方針に従う）

## 3. GitHub Actions（PRゲートのみ、デプロイは行わない）

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
      - pnpm build         # next build
      - Workerバンドルサイズ監視（wrangler deploy --dry-run の gzipサイズを閾値チェック）
```

- main は required checks（ci）+ 直 push 禁止。**デプロイは Workers Builds が main merge を検知して自動実行**（継続的デプロイ）
- E2E（Playwright）は M1 の中核ループ実装後に `ci.yml` へ追加、または別ワークフローとして main push 時のみ実行
- リリースノート: Release Please（Conventional Commits から CHANGELOG / タグ自動生成）を β から導入

## 4. ローカル開発フロー

```bash
pnpm dev                       # next dev（Turbopack）。CF バインディングは
                               # @opennextjs/cloudflare の getCloudflareContext + wrangler proxy 経由
pnpm --filter web preview      # opennext build + wrangler dev（本番同等ランタイム検証）
pnpm db:migrate:local          # ローカル D1 へ適用
```
- 原則 `pnpm dev` で開発し、Workers 固有機能（KV/D1/R2）に触れた PR は `pnpm --filter web preview` での動作確認を PR チェックリストに含める

## 5. パフォーマンス予算（CI で監視）

| 指標 | 予算 |
|---|---|
| Worker バンドル（gzip） | < 3MB（警告）/ < 10MB（CF 上限に対する fail） |
| 初回 JS（クライアント） | < 250KB gzip |
| LCP（モバイル 4G, Lighthouse CI は v1.0 で導入） | < 2.0s |

## 6. 監視・運用

- `observability.enabled = true`（Workers Logs + Invocation logs）
- `/api/v1/health`: D1/KV への疎通を含むヘルスチェック（M2以降）
- Cloudflare の Analytics（リクエスト数・エラー率・CPU 時間）を週次確認。Workers Paid 移行判断の材料に
