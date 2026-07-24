import { buildEspressoSteps } from '../../core/pours';
import type { DripperSpec } from '../types';

/**
 * AeroPress エスプレッソ風。通常の AeroPress（ドリップ寄り・buildPressSteps）とは別の
 * 器具として登録し、少量(40〜90ml程度)・細挽き・低い比率(濃縮)で短時間抽出する。
 * 蒸らしは行わず、全量を一度に注いでから浸漬 → 力強くプレスする。
 */
export const aeropressEspresso: DripperSpec = {
  id: 'aeropress-espresso',
  name: 'AeroPress（エスプレッソ風）',
  brewType: 'pressure',
  geometry: 'cylinder',
  baseGrindMicron: 350,
  grindRangeMicron: [250, 450],
  tempOffsetC: 0,
  lrr: 1.3,
  flowModel: { drawdownBaseSec: 0, flowClass: 'fast' },
  ratioRange: [2, 3],
  features: ['press', 'inverted-capable'],
  buildSteps: (params) => buildEspressoSteps(params, { steepBaseSec: 40, pressDurationSec: 20 }),
  notes:
    '濃縮ぎみのエスプレッソ風ショット。仕上がり量は40〜90ml程度がおすすめ。蒸らしは行わず、全量を注いでから短時間浸漬してプレスする。',
};
