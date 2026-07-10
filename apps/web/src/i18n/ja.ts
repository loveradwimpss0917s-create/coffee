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
      return `目標濃度(TDS) ${r.params.tds}%・抽出収率(EY) ${r.params.ey}% を狙ってレシピを組み立てました。`;
    case 'temperature.byRoastProcess': {
      const roast = ROAST_LEVEL_LABELS[r.params.roastLevel as RoastLevel] ?? r.params.roastLevel;
      const process = PROCESS_LABELS[r.params.process as Process] ?? r.params.process;
      return `${roast}×${process}のため、湯温を ${r.params.tempC}°C に設定しました。`;
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
      return '序盤と終盤の注湯配分で、酸味と甘さのバランスを調整しています（4:6メソッドの考え方）。';
    case 'switchMode.percolation':
      return 'クリア感を重視した好みのため、弁を開けたまま透過主体で抽出します。';
    case 'switchMode.immersion':
      return 'ボディを重視した好みのため、弁を閉じて浸漬主体で抽出します。';
    case 'switchMode.hybrid':
      return 'バランス重視の好みのため、前半は透過・後半は温度を下げて浸漬するハイブリッド方式にしました。';
    case 'iced.dilutionCompensation':
      return '仕上がりの一部を氷に置き換えるため、濃いめ・細かめ・熱めに調整し、希釈後にちょうど良くなるようにしています。';
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
