import { buildPercolationSteps } from '../../core/pours';
import type { DripperSpec } from '../types';

/**
 * April Brewer。低いプロファイル・フラット構造で高温短時間の抽出に向く。
 * World Brewers Cup で浅煎りの高温レシピと共に使われることが多い。
 */
export const april: DripperSpec = {
  id: 'april',
  name: 'April Brewer',
  brewType: 'percolation',
  geometry: 'flat',
  baseGrindMicron: 680,
  grindRangeMicron: [450, 950],
  tempOffsetC: 1,
  lrr: 2.0,
  flowModel: { drawdownBaseSec: 150, flowClass: 'medium' },
  ratioRange: [14, 17],
  features: [],
  buildSteps: (params) =>
    buildPercolationSteps(params, { flowClass: 'medium', drawdownBaseSec: 150 }),
  notes: '低プロファイル・フラット構造。高温短時間の抽出に向く。',
};
