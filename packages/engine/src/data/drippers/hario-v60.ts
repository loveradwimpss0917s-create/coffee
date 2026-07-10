import { buildPercolationSteps } from '../../core/pours';
import type { DripperSpec } from '../types';

/**
 * HARIO V60。リブが大きく自由度が最も高い透過型コーン。
 * 出典: James Hoffmann V60 Ultimate/One-cup method、HARIO 公式レシピ、
 * World Brewers Cup 入賞レシピ群（2023-2025、比率1:14-1:17・湯温88-96°C）。
 */
export const harioV60: DripperSpec = {
  id: 'hario-v60',
  name: 'HARIO V60',
  brewType: 'percolation',
  geometry: 'cone',
  baseGrindMicron: 620,
  grindRangeMicron: [400, 900],
  tempOffsetC: 0,
  lrr: 2.0,
  flowModel: { drawdownBaseSec: 150, flowClass: 'fast' },
  ratioRange: [14, 17],
  features: [],
  buildSteps: (params) =>
    buildPercolationSteps(params, { flowClass: 'fast', drawdownBaseSec: 150 }),
  notes: 'リブが大きく注湯の自由度が高い。投数レバーが最も効きやすい器具。',
};
