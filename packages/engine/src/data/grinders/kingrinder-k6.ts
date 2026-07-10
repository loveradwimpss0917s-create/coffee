import type { GrinderSpec } from '../types';

/** KINGrinder K6。高分解能クリック式。信頼度 community。 */
export const kingrinderK6: GrinderSpec = {
  id: 'kingrinder-k6',
  name: 'KINGrinder K6',
  burrType: 'conical',
  adjustment: { type: 'clicks', micronPerStep: 16, zeroOffsetMicron: 40, maxSteps: 130 },
  confidence: 'community',
};
