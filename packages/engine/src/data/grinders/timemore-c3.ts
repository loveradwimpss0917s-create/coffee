import type { GrinderSpec } from '../types';

/** Timemore C3。手動クリック式コーングラインダー。信頼度 community。 */
export const timemoreC3: GrinderSpec = {
  id: 'timemore-c3',
  name: 'Timemore C3',
  burrType: 'conical',
  adjustment: { type: 'clicks', micronPerStep: 28, zeroOffsetMicron: 40, maxSteps: 40 },
  confidence: 'community',
};
