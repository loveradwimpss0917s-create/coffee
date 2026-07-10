import type { GrinderSpec } from '../types';

/**
 * De'Longhi デディカ KG521J-M（コーン式・一体型）。
 * 公式μm実測データが存在しないため初期値は推定。オーナー実測でのキャリブレーションで
 * `measured` へ昇格予定（docs/11 §4, ロードマップ M1タスク1-14）。
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
