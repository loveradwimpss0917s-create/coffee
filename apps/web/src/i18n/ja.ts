import type { Process, Rationale, RoastLevel } from '@coffee-lab/engine';

/**
 * 文言辞書。MVP は ja のみだが、将来の en 追加を無コストにするため
 * ハードコードせずここに集約する（docs/04 §3.2）。
 */

export const ROAST_LEVEL_LABELS: Record<RoastLevel, string> = {
  light: '浅煎り',
  'medium-light': '中浅煎り',
  medium: '中煎り',
  'medium-dark': '中深煎り',
  dark: '深煎り',
};

export const PROCESS_LABELS: Record<Process, string> = {
  washed: 'ウォッシュト',
  natural: 'ナチュラル',
  honey: 'ハニー',
  anaerobic: '嫌気性発酵',
  decaf: 'デカフェ',
  other: 'その他',
};

export const TASTE_AXIS_LABELS = {
  acidity: '酸味',
  sweetness: '甘さ',
  bitterness: '苦味',
  body: 'ボディ',
  clarity: 'クリア感',
} as const;

export const TASTE_PRESET_LABELS: Record<string, string> = {
  brightFloral: '明るく華やか',
  balanced: 'バランス',
  richDeep: 'コク深い',
  sweetnessFocused: '甘さ重視',
};

/**
 * Rationale の templateId + params を日本語文へレンダリングする（docs/10 §5-(8)）。
 * 将来 en 対応時はこの関数の切替のみで済む。
 */
export function renderRationale(r: Rationale): string {
  switch (r.templateId) {
    case 'strength.target':
      return '濃さの好みに合わせて、粉と湯の量を決めました。';
    case 'temperature.byRoastProcess': {
      const roast = ROAST_LEVEL_LABELS[r.params.roastLevel as RoastLevel] ?? r.params.roastLevel;
      const process = PROCESS_LABELS[r.params.process as Process] ?? r.params.process;
      return `${roast}の${process}なので、湯温を${r.params.tempC}°Cにしました。`;
    }
    case 'temperature.tasteAdjust': {
      const bitterness = Number(r.params.bitterness ?? 0);
      const clarity = Number(r.params.clarity ?? 0);
      if (bitterness > 0) return '苦味の好みに合わせて湯温をやや高めに調整しています。';
      if (bitterness < 0) return '苦味を抑えたい好みに合わせて湯温をやや低めに調整しています。';
      if (clarity > 0) return 'クリア感の好みに合わせて湯温をやや低めに調整しています。';
      return '味の好みに合わせて湯温を微調整しています。';
    }
    case 'pours.fourSixSummary':
      return 'お湯を注ぐタイミングを調整して、酸味と甘さのバランスを整えています。';
    case 'switchMode.percolation':
      return 'クリアな味わいが好みなので、弁を開けたままお湯を通しています。';
    case 'switchMode.immersion':
      return 'しっかりしたコクが好みなので、弁を閉じてお湯に浸しています。';
    case 'switchMode.hybrid':
      return 'バランスの良い味わいが好みなので、前半はお湯を通し、後半は浸して仕上げます。';
    case 'iced.dilutionCompensation':
      return '氷で薄まる分を見込んで、濃いめ・細かめ・熱めに調整しています。';
    default:
      return '';
  }
}

export const GRIND_CONFIDENCE_LABELS = {
  measured: '実測済み',
  community: 'コミュニティ推定値',
  estimated: '推定値（要キャリブレーション）',
} as const;

export const SERVE_STYLE_LABELS = {
  hot: 'Hot',
  iced: 'Iced',
} as const;
