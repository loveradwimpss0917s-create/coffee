import type { GrinderSpec } from '../types';

/** DF64。電動フラットバー、目盛0-90の高分解能。信頼度 community。 */
export const df64: GrinderSpec = {
  id: 'df64',
  name: 'DF64',
  burrType: 'flat',
  adjustment: {
    type: 'numbered',
    micronPerStep: 9,
    zeroOffsetMicron: 100,
    minSetting: 0,
    maxSetting: 90,
    stepSize: 1,
  },
  confidence: 'community',
};
