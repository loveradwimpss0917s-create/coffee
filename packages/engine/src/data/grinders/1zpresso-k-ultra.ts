import type { GrinderSpec } from '../types';

/**
 * 1Zpresso K-Ultra。外部ダイヤル式、1回転あたりクリック数固定の「N周+Mクリック」表記。
 * 出典: コミュニティ計測。信頼度 community。
 */
export const zpressoKUltra: GrinderSpec = {
  id: '1zpresso-k-ultra',
  name: '1Zpresso K-Ultra',
  burrType: 'conical',
  adjustment: {
    type: 'rotations',
    micronPerRotation: 220,
    clicksPerRotation: 10,
    zeroOffsetMicron: 50,
    // 外部ダイヤル一周+クリックで表記される機種の実機総可動域は概ね9〜11周程度（推定値、要実測）
    maxTotalClicks: 100,
  },
  confidence: 'community',
};
