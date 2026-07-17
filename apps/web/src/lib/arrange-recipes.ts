/**
 * AeroPress で作れるアレンジレシピ集。味の好みから逆算する通常のレシピ生成エンジン
 * （packages/engine）とは別物で、固定パラメータの読み物コンテンツとして持つ
 * （docs/06 §1 S16）。スペシャルティコーヒー業界で広く知られたアレンジを参考にしている。
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
      method: '反転式で濃縮液を抽出し、氷でしっかり冷やす',
    },
    mixer: { name: '牛乳（豆乳でも可）', amount: '約150ml + 氷' },
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
    },
    mixer: { name: '炭酸水（お好みでレモンスライス）', amount: '約150ml + 氷' },
    servingNote:
      '炭酸水と氷を入れたグラスに、抽出したコーヒーを静かに注ぐ。混ぜすぎず炭酸を活かす。',
    sourceNote:
      '夏季にカフェで提供されることが多い「コーヒースプリッツァー」系のアレンジを参考にしています。',
  },
];
