import type { GrinderSpec } from '../types';

/** Niche Zero。電動コーン式、0-50の無段階目盛。信頼度 community。 */
export const nicheZero: GrinderSpec = {
  id: 'niche-zero',
  name: 'Niche Zero',
  burrType: 'conical',
  adjustment: {
    type: 'numbered',
    micronPerStep: 10,
    zeroOffsetMicron: 150,
    minSetting: 0,
    maxSetting: 50,
    stepSize: 1,
  },
  confidence: 'community',
};
