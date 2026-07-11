import { buildColdDripSteps } from '../../core/pours';
import type { DripperSpec } from '../types';

/**
 * iwaki ウォータードリップサーバー K-8644-CL。点滴式の水出しコーヒータワー。
 * バルブの滴下スピードは目分量でしか調整できないため、正確な滴下間隔は指定せず
 * 「全量を上部リザーバーに入れて目安時間だけ待つ」という単純な構造にする。
 * 出典: 一般的な点滴式水出しコーヒー（Kyoto-style cold drip）のレシピ慣行（豆:水 比 1:8〜1:12）。
 */
export const iwakiMizudashi: DripperSpec = {
  id: 'iwaki-mizudashi',
  name: 'iwaki ウォータードリップサーバー K-8644-CL',
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
