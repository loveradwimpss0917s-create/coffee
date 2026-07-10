import { buildPercolationSteps } from '../../core/pours';
import type { DripperSpec } from '../types';

/**
 * CAFEC フラワードリッパー。深いリブと花弁状の溝で浅煎りの繊細な香味を引き出す設計。
 */
export const cafecFlower: DripperSpec = {
  id: 'cafec-flower',
  name: 'CAFEC フラワー',
  brewType: 'percolation',
  geometry: 'cone',
  baseGrindMicron: 630,
  grindRangeMicron: [420, 900],
  tempOffsetC: 0,
  lrr: 2.0,
  flowModel: { drawdownBaseSec: 150, flowClass: 'medium' },
  ratioRange: [14, 17],
  features: [],
  buildSteps: (params) =>
    buildPercolationSteps(params, { flowClass: 'medium', drawdownBaseSec: 150 }),
  notes: '深リブ構造で浅煎り豆の華やかな酸を引き出しやすい。',
};
