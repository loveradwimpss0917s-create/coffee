import type { GrinderSpec } from '../types';

/** Wilfa Svart。電動コーン式、目盛1-10。公開データが少なく信頼度 estimated。 */
export const wilfaSvart: GrinderSpec = {
  id: 'wilfa-svart',
  name: 'Wilfa Svart',
  burrType: 'conical',
  adjustment: {
    type: 'numbered',
    micronPerStep: 45,
    zeroOffsetMicron: 200,
    minSetting: 1,
    maxSetting: 10,
    stepSize: 1,
  },
  confidence: 'estimated',
};
