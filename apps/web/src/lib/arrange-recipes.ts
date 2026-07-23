import type { Recipe, RecipeStep } from '@coffee-lab/engine';
import {
  BALANCED_TASTE_PROFILE,
  ENGINE_VERSION,
  micronToGeneralLabel,
  recipeSchema,
} from '@coffee-lab/engine';

/**
 * AeroPress で作れるアレンジレシピ集。味の好みから逆算する通常のレシピ生成エンジン
 * （packages/engine）とは別物で、固定パラメータの読み物コンテンツとして持つ
 * （docs/06 §1 S16）。スペシャルティコーヒー業界で広く知られたアレンジを参考にしている。
 * 他のレシピと同様に注湯スケジュール・抽出タイマーを使えるよう、`arrangeRecipeToRecipe`
 * で通常の生成レシピと同じ `Recipe` 形式に変換する。
 */
export type ArrangeRecipe = {
  id: string;
  name: string;
  tagline: string;
  baseRecipe: {
    doseG: number;
    waterG: number;
    tempC: number;
    method: string;
    grindMicron: number;
    /** 蒸らし湯量・時間 */
    bloomWaterG: number;
    bloomDurationSec: number;
    /** 反転式で浸漬する秒数（プレスに入るまで） */
    steepSec: number;
    pressDurationSec: number;
  };
  mixer: {
    name: string;
    amount: string;
  };
  servingNote: string;
  sourceNote: string;
};

export const ARRANGE_RECIPES: readonly ArrangeRecipe[] = [
  {
    id: 'orange-coffee',
    name: 'オレンジコーヒー',
    tagline: '柑橘の香りとコーヒーの余韻を交互に楽しむ、SNSで話題になった組み合わせ',
    baseRecipe: {
      doseG: 18,
      waterG: 150,
      tempC: 85,
      method: '反転式（インバート）で1:30ほど浸漬してからゆっくりプレス。濃縮ぎみに淹れる',
      grindMicron: 480,
      bloomWaterG: 45,
      bloomDurationSec: 30,
      steepSec: 90,
      pressDurationSec: 25,
    },
    mixer: { name: 'オレンジジュース（冷やしたもの）', amount: '約100ml + 氷' },
    servingNote:
      'グラスに氷とオレンジジュースを先に入れ、抽出したコーヒーを静かに注ぐ。混ぜずに層のまま、コーヒーとオレンジを交互に一口ずつ飲むのがおすすめ。',
    sourceNote:
      '2020年代にスペシャルティコーヒー店やSNSで広まった「オレンジ×コーヒー」の組み合わせを参考にしたアレンジです。',
  },
  {
    id: 'coffee-tonic',
    name: 'コーヒートニック',
    tagline: '苦味・酸味と柑橘系トニックの炭酸感が合わさる、カフェの定番アレンジ',
    baseRecipe: {
      doseG: 18,
      waterG: 120,
      tempC: 88,
      method: '反転式で1:30ほど浸漬。濃いめの濃縮液に仕上げる',
      grindMicron: 480,
      bloomWaterG: 40,
      bloomDurationSec: 30,
      steepSec: 90,
      pressDurationSec: 25,
    },
    mixer: { name: 'トニックウォーター', amount: '約150ml + 氷' },
    servingNote:
      'グラスにトニックウォーターと氷を先に入れ、抽出したコーヒーをそっと注いで層にする。',
    sourceNote: 'スペシャルティコーヒー業界で定番になった「コーヒートニック」のAeroPress版です。',
  },
  {
    id: 'iced-latte',
    name: 'アイスカフェラテ',
    tagline: 'ミルクのコクでまろやかに。AeroPress公式のレシピ集にもある定番アレンジ',
    baseRecipe: {
      doseG: 18,
      waterG: 130,
      tempC: 88,
      method: '反転式で1:30ほど浸漬してから濃縮液を抽出し、氷でしっかり冷やす',
      grindMicron: 480,
      bloomWaterG: 40,
      bloomDurationSec: 30,
      steepSec: 90,
      pressDurationSec: 25,
    },
    mixer: { name: '牛乳(豆乳でも可)', amount: '約150ml + 氷' },
    servingNote:
      '氷を入れたグラスに牛乳を注ぎ、濃縮したコーヒーをゆっくり注ぐ。お好みでシロップを足しても。',
    sourceNote: 'AeroPress公式のレシピ集でも紹介されている、ミルクで割る定番アレンジです。',
  },
  {
    id: 'coffee-soda',
    name: 'コーヒーソーダ',
    tagline: '炭酸の爽快感とコーヒーの香ばしさ。夏場のカフェでよく見かけるアレンジ',
    baseRecipe: {
      doseG: 16,
      waterG: 120,
      tempC: 85,
      method: '反転式で1:15ほど浸漬。濃縮ぎみに仕上げる',
      grindMicron: 500,
      bloomWaterG: 35,
      bloomDurationSec: 30,
      steepSec: 75,
      pressDurationSec: 25,
    },
    mixer: { name: '炭酸水(お好みでレモンスライス)', amount: '約150ml + 氷' },
    servingNote:
      '炭酸水と氷を入れたグラスに、抽出したコーヒーを静かに注ぐ。混ぜすぎず炭酸を活かす。',
    sourceNote:
      '夏季にカフェで提供されることが多い「コーヒースプリッツァー」系のアレンジを参考にしています。',
  },
];

function buildArrangeSteps(base: ArrangeRecipe['baseRecipe']): {
  steps: RecipeStep[];
  totalTimeSec: number;
} {
  const pourAtSec = base.bloomDurationSec;
  const stirAtSec = pourAtSec + 5;
  const pressAtSec = stirAtSec + 10 + base.steepSec;
  const totalTimeSec = pressAtSec + base.pressDurationSec;

  const steps: RecipeStep[] = [
    { kind: 'bloom', atSec: 0, waterG: base.bloomWaterG, durationSec: base.bloomDurationSec },
    { kind: 'pour', atSec: pourAtSec, toWaterG: base.waterG },
    { kind: 'stir', atSec: stirAtSec, method: 'spoon' },
    { kind: 'press', atSec: pressAtSec, durationSec: base.pressDurationSec },
  ];
  return { steps, totalTimeSec };
}

/**
 * アレンジレシピを通常の生成レシピと同じ `Recipe` 形式に変換する。
 * これによりタイマー画面(`/brew/timer`)や注湯スケジュール表示をそのまま再利用できる。
 * 味の好みからの逆算ではなく固定コンテンツのため、rationale は持たない。
 */
export function arrangeRecipeToRecipe(arrange: ArrangeRecipe): Recipe {
  const { baseRecipe: base } = arrange;
  const { steps, totalTimeSec } = buildArrangeSteps(base);
  const ratio = Math.round((base.waterG / base.doseG) * 10) / 10;

  return recipeSchema.parse({
    engineVersion: ENGINE_VERSION,
    input: {
      bean: { roastLevel: 'medium', process: 'washed' },
      equipment: { dripperId: 'aeropress' },
      taste: BALANCED_TASTE_PROFILE,
      strength: 0,
      targetVolumeMl: base.waterG,
      serveStyle: 'iced',
    },
    dripperId: 'aeropress',
    doseG: base.doseG,
    waterG: base.waterG,
    ratio,
    tempC: base.tempC,
    grind: {
      micron: base.grindMicron,
      generalLabel: micronToGeneralLabel(base.grindMicron),
    },
    targetTds: 2.2,
    targetEy: 19,
    steps,
    totalTimeSec,
    rationale: [],
    warnings: [],
  });
}
