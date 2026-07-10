import { buildPressSteps } from '../../core/pours';
import type { DripperSpec } from '../types';

/**
 * French Press。ペーパーを使わない全浸漬式。粗挽き・低温寄り・4分基準の浸漬後プランジ。
 */
export const frenchPress: DripperSpec = {
  id: 'french-press',
  name: 'French Press',
  brewType: 'immersion',
  geometry: 'cylinder',
  baseGrindMicron: 850,
  grindRangeMicron: [700, 1100],
  tempOffsetC: -2,
  lrr: 2.5,
  flowModel: { drawdownBaseSec: 0, flowClass: 'slow' },
  ratioRange: [15, 17],
  features: ['press'],
  buildSteps: (params) => buildPressSteps(params, { steepBaseSec: 240 }),
  notes: 'ペーパー不使用の全浸漬式。オイル分も抽出されボディが強く出る。プランジは弱めに。',
};
