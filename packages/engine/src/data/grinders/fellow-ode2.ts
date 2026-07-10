import type { GrinderSpec } from '../types';

/** Fellow Ode Gen 2。フラットバー・電動。目盛1-11を1/3刻みで調整。信頼度 community。 */
export const fellowOde2: GrinderSpec = {
  id: 'fellow-ode2',
  name: 'Fellow Ode Gen 2',
  burrType: 'flat',
  adjustment: {
    type: 'numbered',
    micronPerStep: 65,
    zeroOffsetMicron: 235,
    minSetting: 1,
    maxSetting: 11,
    stepSize: 1 / 3,
  },
  confidence: 'community',
};
