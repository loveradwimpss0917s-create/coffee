import type { GrinderSpec } from '../types';

/** 1Zpresso ZP6。K/J系と同様の外部ダイヤル式。信頼度 community。 */
export const zpressoZp6: GrinderSpec = {
  id: '1zpresso-zp6',
  name: '1Zpresso ZP6',
  burrType: 'conical',
  adjustment: {
    type: 'rotations',
    micronPerRotation: 250,
    clicksPerRotation: 10,
    zeroOffsetMicron: 50,
  },
  confidence: 'community',
};
