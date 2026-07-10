import { buildPercolationSteps } from '../../core/pours';
import type { DripperSpec } from '../types';

/**
 * KONO 名門ドリッパー。下部のみにリブがあり、序盤は浸漬に近い挙動でゆっくり抽出される。
 * 伝統的に低めの湯温・少なめの投数で点滴的に注がれる。
 */
export const kono: DripperSpec = {
  id: 'kono',
  name: 'KONO 名門',
  brewType: 'percolation',
  geometry: 'cone',
  baseGrindMicron: 600,
  grindRangeMicron: [400, 850],
  tempOffsetC: -1,
  lrr: 2.0,
  flowModel: { drawdownBaseSec: 200, flowClass: 'slow' },
  ratioRange: [13, 16],
  features: [],
  buildSteps: (params) =>
    buildPercolationSteps(params, { flowClass: 'slow', drawdownBaseSec: 200 }),
  notes: '下部のみリブがあり序盤は浸漬的。低めの湯温でゆっくり抽出する伝統スタイル。',
};
