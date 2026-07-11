import { buildColdDripSteps } from '../../core/pours';
import type { DripperSpec } from '../types';

/**
 * HARIO 水出しコーヒーサーバー（点滴式）。iwaki 同様、上部リザーバーからの
 * 滴下速度は目分量でしか調整できないため、コールドドリップの構造は共通の
 * buildColdDripSteps を使う。
 * 出典: 一般的な点滴式水出しコーヒー（Kyoto-style cold drip）のレシピ慣行（豆:水 比 1:8〜1:12）。
 */
export const harioMizudashi: DripperSpec = {
  id: 'hario-mizudashi',
  name: 'HARIO 水出しコーヒーサーバー（点滴式）',
  brewType: 'coldDrip',
  geometry: 'cylinder',
  baseGrindMicron: 1250,
  grindRangeMicron: [1100, 1450],
  tempOffsetC: 0,
  lrr: 2.0,
  flowModel: { drawdownBaseSec: 0, flowClass: 'slow' },
  ratioRange: [8, 12],
  features: [],
  buildSteps: (params) => buildColdDripSteps(params, { minHours: 8, maxHours: 14 }),
  notes:
    '点滴式の水出しタワー。粗挽き+常温〜冷水で8〜14時間ほどかけてゆっくり抽出する。滴下速度は目安（1〜2秒に1滴程度）でOK。',
};
