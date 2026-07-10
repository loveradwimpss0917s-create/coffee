import { buildImmersionSteps } from '../../core/pours';
import type { DripperSpec } from '../types';

/**
 * Clever Dripper。弁を閉じて浸漬 → カップに乗せた瞬間に開放するタイプ。
 * 粒度への感度が低く、ボディ・均一性重視のレシピに向く。
 */
export const clever: DripperSpec = {
  id: 'clever',
  name: 'Clever Dripper',
  brewType: 'immersion',
  geometry: 'cone',
  baseGrindMicron: 780,
  grindRangeMicron: [600, 1000],
  tempOffsetC: 0,
  lrr: 2.2,
  flowModel: { drawdownBaseSec: 60, flowClass: 'medium' },
  ratioRange: [15, 17],
  features: ['valve'],
  buildSteps: (params) => buildImmersionSteps(params, { steepBaseSec: 150, hasValve: true }),
  notes: '浸漬式のため粒度に鈍感。均一で再現性が高い。',
};
