import { buildPressSteps } from '../../core/pours';
import type { DripperSpec } from '../types';

/**
 * AeroPress。加圧式・短時間抽出のため細挽き寄り。液体保持率が低い(紙+加圧で押し出すため)。
 */
export const aeropress: DripperSpec = {
  id: 'aeropress',
  name: 'AeroPress',
  brewType: 'pressure',
  geometry: 'cylinder',
  baseGrindMicron: 500,
  grindRangeMicron: [300, 700],
  tempOffsetC: -2,
  lrr: 1.2,
  flowModel: { drawdownBaseSec: 0, flowClass: 'fast' },
  ratioRange: [12, 16],
  features: ['press', 'inverted-capable'],
  buildSteps: (params) => buildPressSteps(params, { steepBaseSec: 90 }),
  notes: '加圧式で短時間抽出。正立/倒立どちらの淹れ方にも同じ手順を適用。',
};
