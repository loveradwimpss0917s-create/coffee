import type { GrinderSpec } from '../types';

/**
 * De'Longhi デディカ KG521J-M（コーン式・一体型）。
 * 目盛は18段階・1が最も細かく18が最も粗い（オーナー実機で確認済み、docs/11 §4）。
 * ただし目盛とμmの対応(micronPerStep/zeroOffsetMicron)は公式データが無いため引き続き推定。
 * オーナー実測でのキャリブレーションで `measured` へ昇格予定（ロードマップ M1タスク1-14）。
 */
export const delonghiKg521: GrinderSpec = {
  id: 'delonghi-kg521',
  name: "De'Longhi デディカ KG521J-M",
  burrType: 'conical',
  adjustment: {
    type: 'numbered',
    micronPerStep: 55,
    zeroOffsetMicron: 150,
    minSetting: 1,
    maxSetting: 18,
    stepSize: 1,
  },
  confidence: 'estimated',
};
