/**
 * 産地プロファイル（docs/10 §5-(2), §5-(4)）。
 * 産地は自由入力(+サジェスト)のため、ここではエイリアス文字列の部分一致で
 * ゆるく同定する。特定の農園・ロットではなく「国・代表的な産地」単位の一般的な
 * 傾向（スペシャルティコーヒー業界で広く共有される慣用的な理解）を反映した
 * 小さな補正に留め、断定的な表現は避ける（docs/10 §1 免責の設計）。
 *
 * deltaEy: 目標EYへの加算(%)。tempOffsetC: 湯温への加算(°C)。
 * どちらも焙煎度/精製方法による既存の補正（例: natural: -1.5°C）と同程度の
 * 小さな値に抑え、産地だけで極端な変化が起きないようにする。
 */
export type OriginProfile = {
  id: string;
  /** UI表示用の日本語名 */
  name: string;
  /** 自由入力欄とのマッチングに使う別名・表記ゆれ（小文字化して部分一致） */
  aliases: string[];
  deltaEy: number;
  tempOffsetC: number;
};

export const ORIGIN_PROFILES: OriginProfile[] = [
  {
    id: 'ethiopia',
    name: 'エチオピア',
    aliases: [
      'エチオピア',
      'ethiopia',
      'イルガチェフェ',
      'yirgacheffe',
      'グジ',
      'guji',
      'シダモ',
      'sidamo',
    ],
    // 高地・明るい酸とフローラルさが特徴とされる産地。低めのEYで酸のクリーンさを、
    // やや高温で華やかな香りを引き出す方向の慣用的な傾向。
    deltaEy: -0.3,
    tempOffsetC: 0.5,
  },
  {
    id: 'kenya',
    name: 'ケニア',
    aliases: ['ケニア', 'kenya', 'ニエリ', 'nyeri', 'キリニャガ', 'kirinyaga'],
    deltaEy: -0.2,
    tempOffsetC: 0.5,
  },
  {
    id: 'rwanda',
    name: 'ルワンダ',
    aliases: ['ルワンダ', 'rwanda'],
    deltaEy: -0.2,
    tempOffsetC: 0.3,
  },
  {
    id: 'panama',
    name: 'パナマ',
    aliases: ['パナマ', 'panama', 'ゲイシャ', 'geisha', 'gesha'],
    // ゲイシャ比率が高く繊細な香気成分が多いとされ、低EY・やや高温寄りに倒す。
    deltaEy: -0.4,
    tempOffsetC: 0.5,
  },
  {
    id: 'colombia',
    name: 'コロンビア',
    aliases: ['コロンビア', 'colombia', 'ウイラ', 'huila', 'ナリーニョ', 'narino'],
    // バランス型の代表格として基準(補正なし)に位置づける。
    deltaEy: 0,
    tempOffsetC: 0,
  },
  {
    id: 'guatemala',
    name: 'グアテマラ',
    aliases: [
      'グアテマラ',
      'guatemala',
      'アンティグア',
      'antigua',
      'ウエウエテナンゴ',
      'huehuetenango',
    ],
    deltaEy: 0,
    tempOffsetC: 0,
  },
  {
    id: 'costa-rica',
    name: 'コスタリカ',
    aliases: ['コスタリカ', 'costa rica', 'タラス', 'tarrazu'],
    deltaEy: -0.1,
    tempOffsetC: 0.3,
  },
  {
    id: 'brazil',
    name: 'ブラジル',
    aliases: ['ブラジル', 'brazil', 'セラード', 'cerrado'],
    // 低地・ナッツ/チョコレート系の甘さとボディが出やすいとされる産地。
    // やや高いEYでコクを、低めの湯温で苦味/渋みを抑える方向の慣用的な傾向。
    deltaEy: 0.3,
    tempOffsetC: -0.5,
  },
  {
    id: 'indonesia',
    name: 'インドネシア',
    aliases: [
      'インドネシア',
      'indonesia',
      'マンデリン',
      'mandheling',
      'スマトラ',
      'sumatra',
      'スラウェシ',
      'sulawesi',
    ],
    // スマトラ式などの精製由来で低酸・重厚なボディが出やすいとされる。
    deltaEy: 0.4,
    tempOffsetC: -1,
  },
  {
    id: 'vietnam',
    name: 'ベトナム',
    aliases: ['ベトナム', 'vietnam', 'ロブスタ', 'robusta'],
    deltaEy: 0.3,
    tempOffsetC: -0.5,
  },
  {
    id: 'honduras',
    name: 'ホンジュラス',
    aliases: ['ホンジュラス', 'honduras'],
    deltaEy: 0,
    tempOffsetC: 0,
  },
  {
    id: 'yemen',
    name: 'イエメン',
    aliases: ['イエメン', 'yemen', 'モカ', 'mocha'],
    deltaEy: 0.2,
    tempOffsetC: 0,
  },
];
