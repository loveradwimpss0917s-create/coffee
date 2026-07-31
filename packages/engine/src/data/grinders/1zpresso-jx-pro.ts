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
    // 外部ダイヤル一周+クリックで表記される機種の実機総可動域は概ね9〜11周程度（推定値、要実測）
    maxTotalClicks: 100,
  },
  confidence: 'community',
};
