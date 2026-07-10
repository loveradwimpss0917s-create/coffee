import type { GrinderSpec } from '../types';

/** Baratza Encore。電動・numbered目盛(1-40)。信頼度 community。 */
export const baratzaEncore: GrinderSpec = {
  id: 'baratza-encore',
  name: 'Baratza Encore',
  burrType: 'conical',
  adjustment: {
    type: 'numbered',
    micronPerStep: 25,
    zeroOffsetMicron: 50,
    minSetting: 1,
    maxSetting: 40,
    stepSize: 1,
  },
  confidence: 'community',
};
