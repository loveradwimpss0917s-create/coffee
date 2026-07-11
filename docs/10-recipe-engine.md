# 10. レシピ生成エンジン設計（アルゴリズム・味覚パラメータ）

このドキュメントがプロダクトの心臓部。実装は `packages/engine`。

## 1. 科学的根拠（調査サマリ）

エンジンの各係数には根拠となる出典をコードコメントで必ず付記する。主要な理論的基盤:

### 1.1 SCA ゴールデンカップ / 抽出理論
- **抽出収率（EY: Extraction Yield）18–22%**、**濃度（TDS）1.15–1.45%**（SCA は 1.15–1.35 を中心帯とする）が
  官能的にバランスが取れる領域（SCA Brewing Control Chart）
- EY < 18%: 酸・塩味が支配し「酸っぱい・薄い・青い」/ EY > 22%: ポリフェノール系の苦味・渋み・収斂性が出る
- **物質は抽出される順序がある**: 果実酸・塩類（速い）→ 糖・メイラード由来の甘味（中間）→ 苦味・渋み（遅い）。
  この順序性が「注湯構造で味を設計できる」根拠（Kasuya 4:6 メソッド、Rao らの実務理論）

### 1.2 パラメータと味の関係（エンジンの操作レバー）
| レバー | 効果（一次近似） |
|---|---|
| 粉/湯比率 | 濃度（TDS）に直結。比率を締める→濃く・ボディ増 |
| 粒度 | 表面積→抽出速度と流速の両方を支配。細かい→EY↑・接触時間↑・渋みリスク↑ |
| 湯温 | 抽出速度・特に苦味物質の溶出。高温→EY↑・苦味↑・華やかさ↑（浅煎り） |
| 注湯回数/攪拌 | 攪拌↑→EY↑・微粉移動↑（渋み・詰まりリスク） |
| 序盤:終盤の注湯配分 | 序盤大→酸/明るさ強調、序盤小→甘さ強調（4:6 理論） |
| 浸漬 vs 透過 | 浸漬→均一・ボディ寄り・粒度鈍感 / 透過→クリア・レイヤー感・粒度敏感 |
| 焙煎度 | 深いほど多孔質で溶けやすい→低温・粗め方向へ補正 |
| 精製 | ナチュラル/嫌気性は香味が強く出る→やや低温・低EYで整える |

### 1.3 参照した公開レシピ（`data/references/` に出典つきで収録する）
- Tetsu Kasuya 4:6 メソッド（World Brewers Cup 2016 優勝）: 20g/300g・粗挽き・前半40%で味、後半60%で濃度
- Kasuya Hario Switch「ハイブリッド」（2025）: 透過(高温)→浸漬(70–80°C)の温度段差で雑味を抑制。
  0:00 蒸らし→0:35 開→1:30 まで注湯→2:05 **閉**→2:10 低温湯→2:45 **開**
- James Hoffmann V60 1-cup / Ultimate: 高温・細かめ・スワール攪拌
- World Brewers Cup 入賞レシピ群（2023–2025）: 比率 1:14–1:17、湯温 88–96°C、3–5 投が主流
- 器具メーカー公式（HARIO / Kalita / ORIGAMI / CAFEC / AeroPress ほか）

> **免責の設計**: エンジンは「科学的に妥当な出発点」を生成するものであり、UI では断定表現を避ける（docs/05 §6）。

## 2. 公開 API（packages/engine）

```ts
// 決定論・純粋関数・throw しない（clamp + warnings）
function generateRecipe(input: BrewInput, options?: GenerateOptions): Recipe;
function adjustFromFeedback(input: BrewInput, history: BrewFeedback[]): BrewInput; // β
function convertMicronToSetting(micron: number, grinder: GrinderSpec, calibration?: Calibration): GrindSetting;
function migrateRecipeJson(json: unknown): Recipe; // 旧バージョン JSON の読み込み
const ENGINE_VERSION: string; // semver。アルゴリズム変更で minor+、互換破壊で major+
```

## 3. 入力スキーマ（BrewInput）

```ts
const brewInputSchema = z.object({
  bean: z.object({
    roastLevel: z.enum(['light', 'medium-light', 'medium', 'medium-dark', 'dark']),
    process: z.enum(['washed', 'natural', 'honey', 'anaerobic', 'decaf', 'other']).default('washed'),
    daysOffRoast: z.number().int().min(0).max(365).optional(), // 焙煎からの日数
    origin: z.string().optional(),   // v1: 表示用。将来: 産地別補正
  }),
  equipment: z.object({
    dripperId: z.string(),           // engine data の ID
    grinderId: z.string().optional(),
    filterId: z.string().optional(), // 将来: ペーパー種別補正
  }),
  taste: tasteProfileSchema,          // §4
  strength: z.number().min(-2).max(2).default(0), // 濃度の好み（TDS 軸、味5軸とは独立）
  targetVolumeMl: z.number().min(100).max(1000).default(250), // 出来上がり量
  serveStyle: z.enum(['hot', 'iced']).default('hot'),
  waterHardnessPpm: z.number().optional(), // 将来補正用（v1では warnings のみ）
  calibration: grinderCalibrationSchema.optional(),
});
```

## 4. 味覚パラメータ設計（TasteProfile）

### 4.1 5軸の定義（-2 〜 +2 の整数、0 = バランス）

| 軸 | key | +方向の意味 | 主な操作レバー（優先順） |
|---|---|---|---|
| 酸味 | `acidity` | 明るく果実的な酸を強調 | 序盤注湯比↑ → EY 目標↓ → 湯温（浅煎りは↑/深煎りは↓） |
| 甘さ | `sweetness` | 甘さ・丸さを強調 | EY 目標を中庸最適点へ → 序盤注湯比↓ → 蒸らし長め |
| 苦味 | `bitterness` | 心地よい苦味・ロースト感 | 湯温↑ → EY 目標↑ → 終盤注湯を細かく |
| ボディ | `body` | 質感・重さ・オイル感 | 比率締め → 浸漬要素↑（可能な器具） → 粒度微細化 |
| クリア感 | `clarity` | 透明感・レイヤー感 | 粒度粗め+攪拌↓ → 透過要素↑ → 湯温↓ |

- **5軸は互いに完全独立ではない**（例: クリア感+2 とボディ+2 は物理的に両立しない）。
  矛盾する組合せはベクトルの射影で妥協解を作り、`warnings[]` に「ボディとクリア感はトレードオフです」を出す
- UI プリセット: 明るく華やか `{a+2,s+1,b-1,bd-1,c+2}` / バランス all 0 / コク深い `{a-1,s+1,b+1,bd+2,c-1}` / 甘さ重視 `{a-1,s+2,b0,bd+1,c0}`

### 4.2 strength（濃度）を味と分離する理由
「濃い＝苦い」ではない（濃くてクリーンな杯は存在する）。TDS 軸（strength）と EY 側の味設計を
独立に扱うのが Brewing Control Chart の本質であり、UI でも別ステップで聞く。

## 5. 生成パイプライン（generate.ts）

決定論の 8 ステージ。各ステージは純関数で、中間値を `trace` に記録（デバッグ・根拠表示の素材）。

```
BrewInput
 → (1) resolve     : dripperId/grinderId → スペック解決、入力の clamp
 → (2) targets     : TDS・EY 目標値の決定
 → (3) ratio       : 粉量・湯量・比率の計算
 → (4) temperature : 湯温の決定
 → (5) grind       : 目標粒度(μm) → 目盛変換
 → (6) structure   : 注湯/浸漬スケジュール生成（ドリッパーテンプレート）
 → (7) validate    : 物理制約チェック・clamp・warnings 確定
 → (8) explain     : Rationale（根拠）生成
 → Recipe
```

### (2) targets — 目標 TDS / EY

```
baseTds = 1.32%                                  // Golden Cup 中庸やや上（現代のスペシャルティ嗜好）
tds     = clamp(baseTds + strength * 0.09, 1.10, 1.55)
baseEy  = 20.0%
ey      = clamp(baseEy + Σ(味軸ごとの ΔEY), 17.5, 22.5)
  ΔEY: acidity: -0.4%/step, sweetness: +0.2%/step(0→+2), bitterness: +0.5%/step,
       clarity: -0.3%/step, body: +0.1%/step
  焙煎補正: dark: -0.8%, medium-dark: -0.4%（深煎りは低EYでも十分な溶出があるため）
  精製補正: natural/anaerobic: -0.5%（発酵由来フレーバーの過抽出を回避）
```

### (3) ratio — 質量計算（LRR モデル）

```
beverageG = targetVolumeMl（hot; icedは §7）
doseG     = beverageG * tds / ey                 // EY = beverage×TDS / dose の逆算
waterG    = beverageG + doseG * LRR              // LRR(液体保持率) ≈ 2.0 g/g（透過）, 2.2（浸漬+粉残し）
ratio     = waterG / doseG                       // 表示用（例 1:16.4）
doseG は 0.5g 刻み、waterG は 5g 刻みに丸め、丸め後に ratio を再計算
```
検算例: 250ml, TDS1.32, EY20 → dose 16.5g, water 283g ≈ 1:17.2 → strength+1 なら 1:15.9。実勢レシピ（1:14–1:17）と整合。

### (4) temperature — 湯温モデル

```
base(roast): light 94 / medium-light 92 / medium 90 / medium-dark 87 / dark 84 (°C)
+ process: natural/anaerobic -1.5, honey -0.5
+ taste: bitterness*1.2 - clarity*0.8 + (roastが light系なら acidity*0.6)
+ dripper.tempOffset（例: 金属フィルタ系 +1）
+ daysOffRoast < 5 → -1（ガス多く暴れるため）/ > 30 → +1
clamp(78, 97)、0.5°C 刻み
```

### (5) grind — 粒度モデル

```
baseMicron(dripper): V60 620 / Kalita 700 / 浸漬系 800 / AeroPress 500 など（docs/11 の表が正）
+ 総湯量補正: targetVolume が基準250mlから±100mlごとに ±40μm（大バッチは粗く）
+ EY 補正: (20.0 - ey) * 25μm（高EY狙い→細かく）
+ clarity*30μm - body*20μm
clamp(dripper.grindRange)
→ convertMicronToSetting() で目盛へ（docs/11 §3–4）。出力は一般表記と目盛の両方
```

### (6) structure — 注湯スケジュール生成

ドリッパーごとの **テンプレート関数**（`data/drippers/*.ts` が保持）にパラメータを渡して
`RecipeStep[]` を生成する。ステップは discriminated union:

```ts
type RecipeStep =
  | { kind: 'pour';   atSec: number; toWaterG: number; note?: PourNote }  // 累計湯量
  | { kind: 'bloom';  atSec: number; waterG: number; durationSec: number }
  | { kind: 'wait';   atSec: number; untilSec: number }
  | { kind: 'stir';   atSec: number; method: 'swirl' | 'spoon' }
  | { kind: 'valve';  atSec: number; state: 'open' | 'closed' }           // Switch / Clever
  | { kind: 'press';  atSec: number; durationSec: number }                // AeroPress / FrenchPress
  | { kind: 'temperatureChange'; atSec: number; toTempC: number }         // Kasuya Hybrid 型
  | { kind: 'drawdown'; atSec: number; expectedEndSec: number };
```

透過型テンプレートの共通ロジック（V60 系）:
```
bloomWater = doseG * 2.5〜3.0（浅煎りほど多く）, bloomTime = 40s（daysOffRoast<5 なら 45s）
pourCount  = 2 + round((strength + bitterness)/2 + waterG/150) を 2..5 に clamp   // 4:6理論: 投数↑=攪拌↑=濃度・抽出↑
firstPhaseRatio = 0.4 + acidity*0.05 - sweetness*0.05   // 序盤(蒸らし含む2投)の湯量比。4:6理論
各 pour の atSec は dripper.flowModel（湯抜け速度係数）から漸化的に算出
expectedEndSec = dripper.baseDrawdown + f(粒度, 湯量)
```

浸漬型（Clever / French Press）: `steepTimeSec = base + body*30 - clarity*20`、攪拌有無を taste から決定。
ハイブリッド（**HARIO Switch 360**）: §6 参照。
coldDrip（点滴式水出し。iwaki/HARIO の水出しタワー）: §6.1 参照。

### (8) explain — 根拠生成

各ステージが `trace` に残した「適用ルールと差分」を、人間向け文章テンプレートに変換:
```ts
type Rationale = { paramKey: 'temperature' | 'grind' | ...; text: string; sourceRefs?: string[] };
// 例: { paramKey: 'temperature', text: '浅煎り × ウォッシュトのため 92°C と高めに設定し、華やかな酸を引き出します。', sourceRefs: ['sca-brewing-control-chart'] }
```
i18n 対応のため text はテンプレート ID + パラメータで保持し、表示時に文章化する。

## 6. HARIO Switch 360 の特別対応（要件）

Switch は「弁の開閉」で透過と浸漬を切り替えられるため、**taste ベクトルからモードを選択**する:

| 条件 | モード | スケジュール概要 |
|---|---|---|
| clarity ≧ body + 1 | **透過主体**（常時開） | V60 テンプレート + 弁 open 固定 |
| body ≧ clarity + 1 | **浸漬主体** | 閉で注湯 → steep → 開放 drawdown |
| それ以外（バランス） | **ハイブリッド（Kasuya 2025 型）** | 開で蒸らし+序盤透過（高温）→ 閉じて低温追い湯で浸漬 → 開放 |

## 6.1 coldDrip（点滴式水出し）の特別対応

iwaki ウォータードリップサーバー K-8644-CL / HARIO 水出しコーヒーサーバー（点滴式）のような
点滴式タワーは、上部リザーバーからの滴下速度をユーザーがバルブの目分量でしか調整できない
（正確な「1秒に1滴」のような制御はできない）。そのため他のドリッパーのような複数投・
温度変化ステップは持たず、次の最小構成にする（`buildColdDripSteps`, docs/11）:

```
steps = [
  { kind: 'pour', atSec: 0, toWaterG: waterG },   // 上部リザーバーに全量を投入
  { kind: 'wait', atSec: 0, untilSec: dripSec },   // 目安時間(8〜14時間)だけ待つ
]
dripHours = clamp(10 + strength*1 + body*0.5 - clarity*0.5, 8, 14)
tempC     = COLD_DRIP_TEMP_C (固定 4°C。加熱しないため docs/10 §5-(4) の湯温モデルは使わない)
isIced    = 常に false（すでに冷たいため「アイス」設定は無視し warnings で伝える）
```

根拠(Rationale)も温度/投数系のテンプレートは使わず、専用の `coldDrip.summary` 1本にまとめる
（explain.ts で `dripper.brewType === 'coldDrip'` を分岐）。

ハイブリッドの生成パラメータ（20g/300g 基準をスケール）:
```
0:00 bloom（開・tempC）→ 0:35 pour to 40% → 1:30 valve closed
→ temperatureChange: tempC - (10 + bitterness*-3)  ※二段温度。苦味を抑えたいほど下げ幅大
→ 残り湯量を注ぐ → steep（2:05–2:45 相当をスケール）→ valve open → drawdown
```
弁操作はすべて `valve` ステップとして明示し、タイマー画面で 🔓/🔒 表示（docs/06 S04）。

## 7. Iced（急冷式）

```
iceRatio  = 0.35                       // 出来上がりの 35% を氷で置換
brewWaterG = totalWaterG * (1 - iceRatio)、iceG = totalWaterG * iceRatio
tds 目標 +0.35%（氷融解の希釈補正）→ 結果として比率 ~1:10–12 の濃厚抽出
grind: -40μm（短時間で高EYを取るため細かく）/ temp: +1°C
structure: 投数を1減らし早めに落とし切る（酸化と過冷却を避ける）
warnings: サーバーに氷を先に入れる指示ステップを挿入
```

## 8. フィードバックループ（β: adjustFromFeedback）

抽出後の「感じた5軸」(felt) と「目標5軸」(target) の差分から、次回の同条件生成に補正をかける:

```
error = felt - target（軸ごと）
補正例: 苦味 error +2 → 次回 temp -1.5°C & ey -0.5% / 酸味 error +2（酸っぱすぎ）→ ey +0.5% & grind -20μm
直近 n=3 件の指数加重平均。補正は「入力への差分」(BrewInputPatch) として返し、生成パイプライン自体は不変
補正上限: 各パラメータの ±1 ステップ/回（発散防止）
```
これは将来 AI 最適化（v2.0）に置き換わる部分だが、**インターフェース（history in / patch out）は同一**にしておく。

## 9. 参照レシピブレンド（v1.0 以降の拡張フック）

`data/references/` の大会・公式レシピは `BrewInput 条件 + Recipe + 出典` の形で収録。
将来、生成結果と条件が近い参照レシピを「プロのレシピも見る」として並列表示（ブレンドはせず提示のみ。
理論生成と実例提示を混ぜない — 説明可能性を守るため）。

## 10. バージョニングとテスト（docs/14 と連動）

- `ENGINE_VERSION`: 係数変更 = minor、スキーマ変更 = major。Recipe JSON に常に埋め込む
- **ゴールデンテスト**: 代表 30 ケース（豆×器具×味の組合せ）の生成結果スナップショット。
  係数変更 PR は差分レビューで妥当性を判断（「92→91°C になった」が見える）
- **プロパティテスト**: 全入力空間で不変条件を検証
  - 湯温 78–97°C / 比率 1:10–1:20 / EY 17.5–22.5 / ステップの atSec 単調増加 /
    最終累計湯量 = waterG / Switch の valve 開閉が対で整合 / warnings なしで NaN が出ない
- 官能検証: リリース前に主要 10 レシピを実抽出してチェック（人力 QA、ロードマップに組込み）
