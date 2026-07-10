import type { GrinderSpec } from '../types';

/** Mahlkönig EK43。業務用フラットバー、目盛0-16(0.5刻み)。信頼度 community。 */
export const mahlkonigEk43: GrinderSpec = {
  id: 'mahlkonig-ek43',
  name: 'Mahlkönig EK43',
  burrType: 'flat',
  adjustment: {
    type: 'numbered',
    micronPerStep: 55,
    zeroOffsetMicron: 100,
    minSetting: 0,
    maxSetting: 16,
    stepSize: 0.5,
  },
  confidence: 'community',
};
