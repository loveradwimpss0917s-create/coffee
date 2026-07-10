import type { GrinderSpec } from '../types';

/** 1Zpresso JX-Pro。外部ダイヤル式、フィルター向けに広い調整域を持つ。信頼度 community。 */
export const zpressoJxPro: GrinderSpec = {
  id: '1zpresso-jx-pro',
  name: '1Zpresso JX-Pro',
  burrType: 'conical',
  adjustment: {
    type: 'rotations',
    micronPerRotation: 125,
    clicksPerRotation: 10,
    zeroOffsetMicron: 50,
  },
  confidence: 'community',
};
