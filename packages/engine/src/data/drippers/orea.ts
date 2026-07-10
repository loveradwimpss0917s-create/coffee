import { buildPercolationSteps } from '../../core/pours';
import type { DripperSpec } from '../types';

/**
 * Orea Brewer。開口部が大きく非常に流速が速いフラット系ドリッパー。
 * 流速が速い分、粒度をやや細かめにして接触時間を確保する。
 */
export const orea: DripperSpec = {
  id: 'orea',
  name: 'Orea Brewer',
  brewType: 'percolation',
  geometry: 'flat',
  baseGrindMicron: 600,
  grindRangeMicron: [400, 900],
  tempOffsetC: 0,
  lrr: 2.0,
  flowModel: { drawdownBaseSec: 130, flowClass: 'fast' },
  ratioRange: [14, 17],
  features: [],
  buildSteps: (params) =>
    buildPercolationSteps(params, { flowClass: 'fast', drawdownBaseSec: 130 }),
  notes: '開口部が大きく流速が非常に速い。他ドリッパーよりやや細かめの粒度が基準。',
};
