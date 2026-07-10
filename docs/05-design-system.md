# 05. UI/UX設計方針・デザインシステム

## 1. デザイン原則（Apple 純正アプリ水準を目指す）

1. **Content first**: 装飾よりコンテンツ。1画面1タスク。認知負荷を下げる
2. **Calm luxury**: 高級感は「余白・タイポグラフィ・質感」で作る。派手な色やグラデーションに頼らない
3. **Fluid**: すべての状態変化にトランジション。ただし 200ms 前後・interruptible・`prefers-reduced-motion` 尊重
4. **One-handed**: 主要操作は画面下半分（サムゾーン）。ナビは下部タブ
5. **Trust through explanation**: 生成レシピには必ず「なぜ」を添える。ブラックボックスにしない

## 2. デザイントークン

トークンは `apps/web/src/app/globals.css` に CSS 変数として定義し、Tailwind v4 の `@theme` で公開する。
**コンポーネントは必ずトークン経由で色・余白を参照する（hex 直書き禁止）。**

### 2.1 カラー

コンセプト: 「深煎りの艶」。ダークモードが基準（コーヒーアプリはキッチンの薄暗い朝に使われる）。
ライトは「明るいカフェのラテ」。

```css
/* Dark (default) */
--background:      oklch(0.17 0.012 60);   /* 焦げ茶がかった黒 #1a1713 相当 */
--surface:         oklch(0.22 0.014 60);   /* カード */
--surface-raised:  oklch(0.26 0.016 60);   /* モーダル・浮き要素 */
--foreground:      oklch(0.96 0.008 80);   /* 温白 */
--muted-foreground:oklch(0.72 0.012 70);
--border:          oklch(0.32 0.014 60);
--primary:         oklch(0.72 0.13 65);    /* キャラメル/琥珀 — CTA */
--primary-foreground: oklch(0.15 0.02 60);
--accent-green:    oklch(0.68 0.11 150);   /* 成功・「甘さ」軸 */
--destructive:     oklch(0.62 0.19 25);
/* 味覚5軸の色（チャート・スライダー用。dataviz 基準でコントラスト検証済みの値を実装時に確定） */
--taste-acidity / --taste-sweetness / --taste-bitterness / --taste-body / --taste-clarity
```

- ライトモードは同 hue で L を反転。`prefers-color-scheme` + 手動トグル（`data-theme`）両対応
- コントラスト: 本文 4.5:1 以上、大きい文字・UI 部品 3:1 以上（WCAG 2.2 AA）

### 2.2 タイポグラフィ

| 用途 | フォント |
|---|---|
| UI 全般 | システムフォントスタック（`-apple-system, BlinkMacSystemFont, "Hiragino Sans", "Noto Sans JP", sans-serif`）— Apple らしさ・日本語品質・0KB |
| 数値（温度・重量・タイマー） | `ui-rounded, "SF Pro Rounded"` フォールバック + `font-variant-numeric: tabular-nums`（桁揺れ防止・必須） |

タイプスケール（1.25倍・4pt グリッドに丸め）:
`display 34/700`, `title1 28/700`, `title2 22/600`, `headline 17/600`, `body 17/400`, `callout 15/400`, `caption 13/400`, `micro 11/500`
行間: 本文 1.6 / 見出し 1.25。日本語は letter-spacing 0〜0.01em。

### 2.3 スペーシング・形状

- スペーシング: 4pt グリッド（4/8/12/16/20/24/32/40/48/64）。画面左右パディング 20px（モバイル）
- 角丸: `--radius-sm: 10px`（入力）, `--radius-md: 14px`(カード), `--radius-lg: 20px`(モーダル), `--radius-full`(ピル)
- 影は最小限。ダークでは影でなく **surface の明度差**で階層表現
- タップターゲット最小 44×44px

### 2.4 モーション

| トークン | 値 | 用途 |
|---|---|---|
| `--ease-out-soft` | `cubic-bezier(0.22, 1, 0.36, 1)` | 出現・遷移 |
| `--duration-fast` | 150ms | ホバー・押下 |
| `--duration-base` | 220ms | 画面内変化 |
| `--duration-slow` | 350ms | 画面遷移・シート |

- 実装は Motion（layout アニメーション・spring）。ページ遷移は View Transitions API（対応ブラウザのみ enhancement）
- タイマー画面の進行リングは spring ではなく linear（時間の正確な表現）
- `prefers-reduced-motion: reduce` で transform 系を fade に置換（グローバルで一括処理）

## 3. コンポーネント方針

- ベース: shadcn/ui（Radix）を `components/ui/` に導入し、トークンを適用してカスタマイズ
- MVP で使う ui: Button, Input, Select, Slider, Dialog, Drawer(Sheet), Tabs, Card, Badge, Skeleton, Sonner(トースト), Form
- アプリ固有の主要コンポーネント（docs/09 §3 に仕様）:
  - `TasteRadar`（5軸レーダーチャート）/ `TasteSliders`
  - `PourTimeline`（注湯スケジュールの視覚化）
  - `BrewTimerRing`（進行リング + 次アクション表示）
  - `GrindDial`（一般表記とグラインダー目盛の併記表示）
  - `SegmentedControl`（iOS風・Hot/Iced 等）
  - `StepperWizard`（生成ウィザードの枠）

## 4. アクセシビリティ（WCAG 2.2 AA）

- すべてのインタラクションはキーボード操作可能。フォーカスリングは `--primary` の 2px アウトライン
- スライダー等のカスタム部品は Radix ベースで ARIA を担保。独自実装時は APG パターン準拠
- タイマーの進行は色だけでなくテキスト・数値でも表現（色覚多様性）
- 動的更新（タイマーのステップ切替）は `aria-live="polite"`、完了は `assertive`
- E2E に axe-core による自動チェックを組み込む（docs/14）
- 音声・振動フィードバック（タイマー）: Vibration API + 効果音はオプトイン

## 5. レスポンシブ戦略

- **モバイルファースト**。ブレークポイント: `sm 640` / `md 768` / `lg 1024`
- 〜md: 下部タブバー + 全画面ページ
- lg〜: サイドバーナビ + 2カラム（一覧/詳細）。タイマー画面のみ常に単一カラム集中レイアウト
- PWA: manifest + アイコン + `display: standalone`。オフラインはエンジンがクライアント動作のため生成機能は自然に動作（Service Worker キャッシュは β で導入）

## 6. ライティングトーン

- 断定しない: 「最適解」ではなく「おすすめの出発点」
- 根拠は1行で: 「浅煎りのため湯温を高めに設定しました」
- 数値は単位つき・タブラー数字で整列
- 絵文字は使わない（高級感の維持）。アイコンは lucide で統一（stroke 1.5px）
