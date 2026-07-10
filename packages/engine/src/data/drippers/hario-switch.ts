import {
  buildImmersionSteps,
  buildPercolationSteps,
  clamp,
  computeBloomDurationSec,
  computeBloomWaterG,
  round1,
} from '../../core/pours';
import type { RecipeStep } from '../../schemas/recipe';
import type { BuildStepsParams, DripperSpec } from '../types';

/**
 * HARIO Switch 360。弁の開閉で透過⇄浸漬を切り替えられるハイブリッド器具。
 * 味の好みベクトルから 3 モードを自動選択する（docs/10 §6）。
 *
 * - クリア感 > ボディ: 透過主体（常時開）
 * - ボディ > クリア感: 浸漬主体（閉じて浸漬 → 開放drawdown）
 * - バランス: ハイブリッド（Tetsu Kasuya 2025「ハイブリッド」型に着想。
 *   開で蒸らし+序盤透過(高温) → 閉じて低温追い湯で浸漬 → 開放drawdown）
 */

function buildHybridSteps(params: BuildStepsParams): RecipeStep[] {
  const { doseG, waterG, tempC, taste, daysOffRoast } = params;
  const bloomWaterG = computeBloomWaterG(doseG, daysOffRoast);
  const bloomDurationSec = computeBloomDurationSec(daysOffRoast);
  const firstPhaseTargetG = round1(waterG * 0.4);

  const closeAtSec = bloomDurationSec + 55;
  const secondPourAtSec = closeAtSec + 5;
  const steepSec = Math.round(40 * (waterG / 300));
  const steepEndSec = secondPourAtSec + 5 + steepSec;

  // 苦味を抑えたい好みほど温度を大きく下げる（docs/10 §6）
  const tempDropC = 10 - taste.bitterness * 3;
  const loweredTempC = clamp(tempC - tempDropC, 60, tempC);

  return [
    { kind: 'valve', atSec: 0, state: 'open' },
    { kind: 'bloom', atSec: 0, waterG: bloomWaterG, durationSec: bloomDurationSec },
    { kind: 'pour', atSec: bloomDurationSec, toWaterG: firstPhaseTargetG, note: 'circular' },
    { kind: 'valve', atSec: closeAtSec, state: 'closed' },
    { kind: 'temperatureChange', atSec: closeAtSec, toTempC: loweredTempC },
    { kind: 'pour', atSec: secondPourAtSec, toWaterG: waterG, note: 'center' },
    { kind: 'wait', atSec: secondPourAtSec + 5, untilSec: steepEndSec },
    { kind: 'valve', atSec: steepEndSec, state: 'open' },
    { kind: 'drawdown', atSec: steepEndSec, expectedEndSec: steepEndSec + 30 },
  ];
}

export const harioSwitch: DripperSpec = {
  id: 'hario-switch',
  name: 'HARIO Switch 360',
  brewType: 'hybrid',
  geometry: 'cone',
  baseGrindMicron: 650,
  grindRangeMicron: [450, 950],
  tempOffsetC: 0,
  lrr: 2.0,
  flowModel: { drawdownBaseSec: 150, flowClass: 'fast' },
  ratioRange: [14, 17],
  features: ['valve'],
  buildSteps: (params) => {
    const { taste } = params;
    if (taste.clarity >= taste.body + 1) {
      const steps = buildPercolationSteps(params, { flowClass: 'fast', drawdownBaseSec: 150 });
      return [{ kind: 'valve', atSec: 0, state: 'open' }, ...steps];
    }
    if (taste.body >= taste.clarity + 1) {
      return buildImmersionSteps(params, { steepBaseSec: 150, hasValve: true });
    }
    return buildHybridSteps(params);
  },
  notes:
    '味の好みから透過主体/浸漬主体/ハイブリッドの3モードを自動選択。弁操作はタイマー画面で明示表示。',
};
