# 09. 状態管理・コンポーネント設計

## 1. 状態の分類と置き場所（唯一の判断表）

| 状態の種類 | 置き場所 | 例 |
|---|---|---|
| サーバー由来データ | TanStack Query（キャッシュ） | 豆一覧・ログ・保存レシピ |
| 進行中のマルチステップ入力 | Zustand store | 抽出ウィザード入力 |
| 実行中プロセス | Zustand store（+ persist） | 抽出タイマー |
| フォームローカル | react-hook-form | 豆編集・フィードバック |
| UI一時状態 | useState / URL | モーダル開閉・タブ選択 |
| 共有すべき表示条件 | **URL search params** | ログのフィルタ・ソート |
| ユーザー設定 | TanStack Query（ログイン）/ localStorage（ゲスト） | テーマ・既定器具 |
| 器具マスタ | なし（engine パッケージの静的データを直接 import） | ドリッパー一覧 |

原則: **グローバルストアは最後の手段**。URL で表現できるものは URL に置く（共有・リロード耐性）。

## 2. ストア設計

### 2.1 `useBrewWizardStore`（Zustand + persist）

```ts
type BrewWizardState = {
  step: 1 | 2 | 3 | 4;
  input: Partial<BrewInput>;          // engine の Zod 型
  setField: <K extends keyof BrewInput>(k: K, v: BrewInput[K]) => void;
  goTo: (step: number) => void;
  loadFrom: (source: Recipe | Brew) => void;  // 「同じ条件で再抽出」
  reset: () => void;
};
```
- persist（sessionStorage）: 誤リロードで入力を失わない
- 生成実行はストアの外（`generateRecipe(brewInputSchema.parse(input))` を result ページで実行）。
  **生成結果はストアに持たず、入力のみ持つ**（結果は入力から決定論的に再導出できるため）

### 2.2 `useBrewTimerStore`（Zustand + persist）

```ts
type BrewTimerState = {
  recipe: Recipe | null;
  startedAt: number | null;        // epoch ms（経過時間は now - startedAt で導出）
  currentStepIndex: number;
  status: 'idle' | 'running' | 'paused' | 'done';
  start: (recipe: Recipe) => void;
  completeStep: () => void;        // 手動進行（将来: BLE スケールが自動発火）
  pause / resume / abort: () => void;
};
```
- `setInterval` で経過秒を state に書かない（毎秒 re-render を全体に波及させない）。
  表示コンポーネントだけが `useSyncExternalStore` + rAF で時刻を購読
- persist（localStorage）: アプリ復帰時に進行中の抽出を復元。startedAt 基準なのでバックグラウンドでも狂わない
- 通知・振動・音は store 外の `TimerEffects` コンポーネントが status/step を購読して発火

### 2.3 TanStack Query 規約

- queryKey は定数ファクトリで一元管理: `keys.beans.list(filter)`, `keys.brews.detail(id)`
- mutation 後は関連 key を invalidate（手動キャッシュ更新は楽観的更新が必要な箇所のみ）
- ゲストモード: 同じ hooks インターフェースで、queryFn が localStorage リポジトリを叩く
  （`Repository` インターフェースを `features/*/repository.ts` に定義し、`LocalRepository` / `ApiRepository` を実装。
  ログイン状態で DI する — **UI コンポーネントはゲスト/ログインを意識しない**）

## 3. コンポーネント設計

### 3.1 設計原則

- **Presentational / Container 分離は hooks で行う**: ロジックは `features/*/use-xxx.ts`、
  コンポーネントは props を受けて描画するだけの純関数に近づける
- コンポーネントは3階層まで: `page → 機能コンポーネント → ui プリミティブ`
- サーバーコンポーネント既定。`'use client'` はウィザード・タイマー・チャート等の葉のみ
- Storybook は導入しない（メンテコスト過剰）。代わりに主要コンポーネントは Vitest browser mode + Playwright で検証

### 3.2 主要カスタムコンポーネント仕様

#### `<TasteSliders value onChange />`
- 5軸（acidity/sweetness/bitterness/body/clarity）の -2..+2 スライダー群
- Radix Slider ベース。各軸に軸色トークン・ラベル・現在値チップ。haptic（vibrate 10ms）
- プリセットチップ（明るく華やか / バランス / コク深い / 甘さ重視）は TasteProfile 定数を適用

#### `<TasteRadar profile compareWith? />`
- SVG 自作（chart ライブラリ不使用 — 5点ポリゴンのみで依存不要）
- `compareWith` で「目標 vs 実際に感じた味」の重ね描き（ログ詳細で使用）
- アニメーション: polygon の points を Motion で補間

#### `<PourTimeline recipe />`
- 横帯: 時間軸に沿って bloom/pour/wait/press 等の RecipeStep を色分け表示 + 縦リスト
- Switch レシピでは弁開閉状態を帯の下に 🔓/🔒 レーンで表示（docs/11）
- 各ステップは `step.kind` による discriminated union を switch して描画（網羅性チェック）

#### `<BrewTimerRing progress targetWaterG currentInstruction />`
- SVG circle + stroke-dashoffset。進行は linear（docs/05 §2.4）
- 中央: 目標湯量（tabular-nums 特大）+ 指示文。`aria-live="polite"`

#### `<GrindDisplay grindMicron grinder calibration? />`
- 「中細挽き（約600μm）」+ 「Comandante C40: 24 クリック」の併記
- 変換ロジックは engine の `convertMicronToSetting()` を呼ぶだけ（UI に計算を持たない）
- 信頼度ラベル（実測/推定）を表示（docs/11 §3）

#### `<StepperWizard steps current onNavigate />`
- 進行ドット + スライドトランジション（Motion `AnimatePresence`、方向対応）
- 各ステップは `<WizardStepBean />` 等の独立コンポーネント。バリデーションは各ステップの Zod partial

### 3.3 レイアウト

- `<AppShell>`: 下部タブ（〜md）/ サイドバー（lg〜）切替、セーフエリア対応（`env(safe-area-inset-*)`）
- タイマー画面は `<FocusLayout>`（ナビ非表示・Screen Wake Lock API で画面消灯防止）

## 4. ゲスト/ログインのデータ層抽象化（重要）

```
features/beans/
├── repository.ts        # interface BeansRepository { list, create, ... }
├── repository.local.ts  # localStorage 実装（Zod envelope, version付き）
├── repository.api.ts    # Hono RPC 実装
└── queries.ts           # useBeans() — セッション有無で実装を選択
```
- この抽象化により: MVP はローカルのみ実装 → β で api 実装を追加、**UI 変更ゼロ**でクラウド同期化
- localStorage スキーマにも `version` を持たせ、migration 関数を用意（engine と同じ方針）
