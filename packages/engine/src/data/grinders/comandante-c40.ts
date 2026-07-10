import type { GrinderSpec } from '../types';

/**
 * Comandante C40 MK4。コミュニティで最も広く参照される基準機。
 * 出典: コミュニティ計測(~30μm/クリック)。信頼度 community。
 */
export const comandanteC40: GrinderSpec = {
  id: 'comandante-c40',
  name: 'Comandante C40 MK4',
  burrType: 'conical',
  adjustment: { type: 'clicks', micronPerStep: 30, zeroOffsetMicron: 50, maxSteps: 45 },
  confidence: 'community',
};
