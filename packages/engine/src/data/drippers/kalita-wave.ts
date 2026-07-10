import { buildPercolationSteps } from '../../core/pours';
import type { DripperSpec } from '../types';

/**
 * Kalita Wave。平底3つ穴で湯が均一に落ちるため注湯の技術差が出にくい。
 * V60 よりやや粗挽き・少投数を既定にする（docs/11 §2）。
 */
export const kalitaWave: DripperSpec = {
  id: 'kalita-wave',
  name: 'Kalita Wave',
  brewType: 'percolation',
  geometry: 'flat',
  baseGrindMicron: 700,
  grindRangeMicron: [500, 1000],
  tempOffsetC: 0,
  lrr: 2.1,
  flowModel: { drawdownBaseSec: 180, flowClass: 'medium' },
  ratioRange: [14, 17],
  features: [],
  buildSteps: (params) =>
    buildPercolationSteps(params, { flowClass: 'medium', drawdownBaseSec: 180 }),
  notes: '平底構造で抽出が均一。注湯の乱れに強い初心者向け設計。',
};
