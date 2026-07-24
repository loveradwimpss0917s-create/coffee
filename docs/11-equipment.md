# 11. ドリッパー・グラインダー対応設計

器具データはすべて `packages/engine/src/data/` にコードとして定義（1器具1ファイル、Zod スキーマ準拠）。
**追加 = データファイル1つの PR** になるのが設計ゴール。DB には ID 文字列のみ保存。

## 1. DripperSpec スキーマ

```ts
const dripperSpecSchema = z.object({
  id: z.string(),                    // 'hario-v60'
  name: z.string(),                  // 'HARIO V60'
  brewType: z.enum(['percolation', 'immersion', 'hybrid', 'pressure', 'coldDrip']),
  geometry: z.enum(['cone', 'flat', 'basket', 'cylinder']),
  sizes: z.array(z.object({ id: z.string(), maxDoseG: z.number() })), // 01/02 等
  baseGrindMicron: z.number(),       // 基準粒度（250ml時）
  grindRangeMicron: z.tuple([z.number(), z.number()]),
  tempOffsetC: z.number().default(0),
  lrr: z.number().default(2.0),      // 液体保持率 g/g
  flowModel: z.object({ drawdownBaseSec: z.number(), flowClass: z.enum(['fast','medium','slow']) }),
  ratioRange: z.tuple([z.number(), z.number()]), // 推奨比率の下限上限
  features: z.array(z.enum(['valve', 'press', 'inverted-capable'])).default([]),
  template: /* (params) => RecipeStep[] を返す関数への参照 */,
  notes: z.string().optional(),      // UI 表示用の器具解説
});
```

## 2. 初期対応ドリッパー 11 種と特性値（初期値。官能QAで調整）

| id | name | type/geometry | 基準粒度 | flow | 特記 |
|---|---|---|---|---|---|
| `hario-v60` | HARIO V60 | percolation/cone | 620μm | fast | リブ大・自由度最大。注湯回数レバーが最も効く |
| `hario-switch` | HARIO Switch 360 | **hybrid**/cone | 650μm | fast(開) | `features:['valve']`。3モード生成（docs/10 §6） |
| `origami` | ORIGAMI | percolation/cone | 640μm | fast | ウェーブ/コーン両ペーパー対応 → filterId で分岐(将来) |
| `cafec-flower` | CAFEC フラワー | percolation/cone | 630μm | medium | 深リブ・浅煎り向き設計 |
| `kalita-wave` | Kalita Wave | percolation/flat | 700μm | medium | 平底=均一抽出・注湯難易度低。投数少なめ既定 |
| `kono` | KONO 名門 | percolation/cone | 600μm | slow | 下部リブのみ→序盤浸漬的。点滴系テンプレート |
| `april` | April Brewer | percolation/flat | 680μm | medium | 低温・粗め・少投数の公式プロファイル反映 |
| `orea` | Orea Brewer | percolation/flat | 690μm | fast | フラット高速系 |
| `clever` | Clever Dripper | **immersion**/cone | 780μm | — | 閉→steep→載せて開放。`features:['valve']` |
| `aeropress` | AeroPress | **pressure**/cylinder | 500μm | — | 正/逆位置、press ステップ。`features:['press','inverted-capable']` |
| `aeropress-espresso` | AeroPress（エスプレッソ風） | **pressure**/cylinder | 350μm | fast | 少量(40〜90ml)濃縮ショット。蒸らし無し、`ratioRange:[2,3]`。§2.1 参照 |
| `french-press` | French Press | immersion/cylinder | 850μm | — | 4:00 steep 基準、プランジ弱く（微粉攪拌回避） |
| `iwaki-mizudashi` | iwaki ウォータードリップサーバー K-8644-CL | **coldDrip**/cylinder | 1250μm | slow | 点滴式水出し。滴下速度は目分量前提で指定しない（オーナー実機） |
| `hario-mizudashi` | HARIO 水出しコーヒーサーバー（点滴式） | **coldDrip**/cylinder | 1250μm | slow | iwaki と同じ点滴式。共通の `buildColdDripSteps` を使用 |

### 2.1 aeropress-espresso（AeroPress エスプレッソ風）の特殊性

- 通常の `aeropress`（ドリップ寄り・`buildPressSteps`）とは別の器具として登録する。同じ物理的な器具でも
  「淹れ方」が別物（少量・細挽き・高比率）なので、taste ベクトルではなく**器具選択そのものを分ける**（docs/06 S02 ウィザードの器具一覧に両方が並ぶ）。
- `ratioRange:[2,3]` という極端に低い値により、`computeRatio()` の比率レンジ補正（docs/10 §5-(3)）が
  自動的に doseG を押し上げる。TDS/EY の目標値自体はドリップ用の一般式のままで問題ない
  （coldDrip と異なり湯温モデルの分岐は不要）。
- 少量ショット(40〜90ml)に対応するため `brewInputSchema.targetVolumeMl` の下限を100mlから30mlに緩和した（後方互換、既存の挙動に影響なし）。
- `buildEspressoSteps`（`core/pours.ts`）は蒸らしステップを持たず、全量を一度に注いでから短時間浸漬 → プレスする。

### coldDrip（点滴式水出し）の特殊性

- 加熱しない前提のため、湯温モデル（docs/10 §5-(4)）を使わず `tempC` は固定値 `COLD_DRIP_TEMP_C`（4°C、冷蔵庫運用前提）にする（`generate.ts` で `dripper.brewType === 'coldDrip'` を分岐）。
- 滴下スピード（1秒あたりの滴数）はバルブの目分量でしかユーザー側で制御できないため、`buildSteps` は「全量を一度に投入 → 目安の総時間(8〜14時間)だけ待つ」という最小構成にする（`pour` + `wait` の既存ステップ種のみで表現でき、スキーマ変更は不要）。
- `serveStyle: 'iced'` は「加熱した後に氷で薄める」ための仕組みのため、coldDrip では常に無視し、代わりに `warnings` でその旨を伝える。
- 粒度は 1100μm を超える非常に粗い挽き目になるため、`micronToGeneralLabel`（docs/11 §3の一般表記閾値）に `粗挽き(1100–1300μm)` / `極粗挽き(>1300μm)` の区分を追加している。

各ファイルには `template` 関数（docs/10 §5-(6) のステップ生成）と、根拠となる公式/著名レシピの出典コメントを含める。

## 3. GrinderSpec スキーマ

```ts
const grinderSpecSchema = z.object({
  id: z.string(),                     // 'comandante-c40'
  name: z.string(),
  burrType: z.enum(['conical', 'flat']),
  adjustment: z.discriminatedUnion('type', [
    z.object({ type: z.literal('clicks'),  micronPerStep: z.number(), zeroOffsetMicron: z.number(), maxSteps: z.number() }),
    z.object({ type: z.literal('numbered'),micronPerStep: z.number(), zeroOffsetMicron: z.number(), minSetting: z.number(), maxSetting: z.number(), stepSize: z.number() }), // 目盛式（0.5刻み等）
    z.object({ type: z.literal('rotations'), micronPerRotation: z.number(), clicksPerRotation: z.number(), zeroOffsetMicron: z.number() }), // 1Zpresso 系「1周+5」表記
  ]),
  confidence: z.enum(['measured', 'community', 'estimated']), // 変換の信頼度（UI表示）
  filterRangeHint: z.tuple([z.number(), z.number()]).optional(), // メーカー推奨フィルター域
});
```

### 変換ロジック（engine/core/grind.ts）

```
setting = (targetMicron - zeroOffsetMicron) / micronPerStep + calibrationOffset
→ stepSize に丸め、レンジ clamp。逆変換も提供
出力: { general: '中細挽き（約620μm）', setting: '24 クリック' | '目盛 8', confidence }
一般表記の閾値: extra-fine <300 / fine 300–500 / medium-fine 500–700 / medium 700–900 / medium-coarse 900–1100 / coarse 1100–1300 / extra-coarse >1300 (μm)
```

## 4. 初期対応グラインダー 12 種（値は community データ由来の初期値・要実測検証）

| id | name | 方式 | μm/step | 信頼度 |
|---|---|---|---|---|
| `delonghi-kg521` | **De'Longhi デディカ KG521J-M** | numbered 1–18（1=最細, 18=最粗、オーナー実機で確認済み） | 推定 ~55 | estimated |
| `comandante-c40` | Comandante C40 MK4 | clicks | ~30 | community |
| `1zpresso-jx-pro` | 1Zpresso JX-Pro | rotations | 12.5/click | community |
| `1zpresso-k-ultra` | 1Zpresso K-Ultra | rotations | ~22/click(外部ダイヤル) | community |
| `1zpresso-zp6` | 1Zpresso ZP6 | rotations | ~25/click | community |
| `timemore-c3` | Timemore C3 | clicks | ~28 | community |
| `kingrinder-k6` | KINGrinder K6 | clicks | 16 | community |
| `baratza-encore` | Baratza Encore | numbered 1–40 | ~25 | community |
| `fellow-ode2` | Fellow Ode Gen 2 | numbered 1–11(1/3刻み) | ~65 | community |
| `wilfa-svart` | Wilfa Svart | numbered | ~45 | estimated |
| `niche-zero` | Niche Zero | numbered 0–50(無段階) | ~10 | community |
| `df64` | DF64 | numbered 0–90 | ~9 | community |
| `mahlkonig-ek43` | Mahlkönig EK43 | numbered 0–16(dial) | ~55 | community |
| `generic` | その他（一般表記のみ） | — | — | — |

- **KG521J-M 対応（オーナーの現用機）**: コーン式・一体型。目盛は1〜18の18段階で
  1が最も細かく18が最も粗い（オーナー実機で確認済み）。目盛とμmの対応（micronPerStep等）は
  公表データが無いため引き続き「目盛中央=中挽き」の仮定で置き、**オーナー実測でキャリブレーション**して
  `measured` に昇格させる（実装後の最初の検証タスク。ロードマップ M2 に組込み）
- `generic` 選択時は目盛表示を省略し一般表記+μm のみ表示（どのグラインダーでも使える逃げ道）

## 5. ユーザーキャリブレーション（docs/06 S10, docs/07 user_grinders）

1. **簡易補正（MVP）**: 「このアプリの『中挽き 700μm』があなたの目盛でいくつか」を1点入力 → `calibrationOffset` を算出
2. **多点補正（将来）**: 複数実測点から回帰で micronPerStep 自体を個体補正（`calibration_points`）
3. フィードバックループ（docs/10 §8）で「渋い/薄い」が続く場合、粒度系の補正を提案するナッジを UI に出す

## 6. 追加のしやすさ（Definition of Done）

新器具の追加 PR は以下だけで完結すること:
1. `data/drippers/xxx.ts`（または grinders）を追加し、`data/index.ts` に登録
2. ゴールデンテストに代表ケース1件追加
3. 出典（公式レシピ URL 等）をコメントで記載
→ UI・DB・API の変更は**一切不要**（一覧は data から自動導出）であることを CI が保証する。
