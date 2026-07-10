import { getDripper, getGrinder } from '../data';
import { harioV60 } from '../data/drippers/hario-v60';
import type { BrewInput, GenerateOptions } from '../schemas/input';
import type { Recipe } from '../schemas/recipe';
import { ENGINE_VERSION } from '../version';
import {
  applyIcedGrindAdjustment,
  applyIcedTdsAdjustment,
  applyIcedTempAdjustment,
  computeIcedWaterSplit,
} from './adjustments';
import { buildRationale } from './explain';
import { computeRatio, computeTargetEy, computeTargetTds } from './extraction';
import { buildGrindResult, computeTargetGrindMicron } from './grind';
import { computeTemperatureC } from './temperature';

/**
 * レシピ生成のメインパイプライン（docs/10 §5）。
 * 決定論・純粋関数・throw しない設計。未登録の器具IDは既定値にフォールバックし
 * warnings に記録する（入力バリデーション自体は呼び出し側の Zod 境界で完了済み前提、docs/08 §4）。
 */
export function generateRecipe(input: BrewInput, _options: GenerateOptions = {}): Recipe {
  const warnings: string[] = [];
  const isIced = input.serveStyle === 'iced';

  // (1) resolve
  const dripperLookup = getDripper(input.equipment.dripperId);
  const dripper = dripperLookup ?? harioV60;
  if (!dripperLookup) {
    warnings.push(
      `未登録のドリッパーID「${input.equipment.dripperId}」のため HARIO V60 の設定で生成しました。`,
    );
  }

  const grinder = input.equipment.grinderId ? getGrinder(input.equipment.grinderId) : undefined;
  if (input.equipment.grinderId && !grinder) {
    warnings.push(
      `未登録のグラインダーID「${input.equipment.grinderId}」のため一般表記(μm)のみ表示します。`,
    );
  }

  // (2) targets
  let targetTds = computeTargetTds(input.strength);
  const targetEy = computeTargetEy(input.taste, input.bean.roastLevel, input.bean.process);
  if (isIced) targetTds = applyIcedTdsAdjustment(targetTds);

  // (3) ratio
  const {
    doseG,
    waterG: totalWaterG,
    ratio,
  } = computeRatio(input.targetVolumeMl, targetTds, targetEy, dripper.lrr, dripper.ratioRange);

  let brewWaterG = totalWaterG;
  if (isIced) {
    const split = computeIcedWaterSplit(totalWaterG);
    brewWaterG = split.brewWaterG;
    warnings.push(`サーバーにあらかじめ氷 ${split.iceG}g を入れてください。`);
  }

  // (4) temperature
  let tempC = computeTemperatureC(
    input.bean.roastLevel,
    input.bean.process,
    input.taste,
    dripper.tempOffsetC,
    input.bean.daysOffRoast,
  );
  if (isIced) tempC = applyIcedTempAdjustment(tempC);

  // (5) grind
  let grindMicron = computeTargetGrindMicron(dripper, input.targetVolumeMl, targetEy, input.taste);
  if (isIced) grindMicron = applyIcedGrindAdjustment(grindMicron);
  grindMicron = clampToRange(grindMicron, dripper.grindRangeMicron);
  const grind = buildGrindResult(grindMicron, grinder, input.equipment.calibration?.offset);

  // (6) structure
  const steps = dripper.buildSteps({
    doseG,
    waterG: brewWaterG,
    tempC,
    taste: input.taste,
    strength: input.strength,
    targetEy,
    daysOffRoast: input.bean.daysOffRoast,
    serveStyle: input.serveStyle,
  });

  // (7) validate
  const totalTimeSec = computeTotalTimeSec(steps);

  // (8) explain
  const rationale = buildRationale({ input, dripper, targetTds, targetEy, tempC, isIced });

  return {
    engineVersion: ENGINE_VERSION,
    input,
    dripperId: dripper.id,
    doseG,
    waterG: totalWaterG,
    ratio,
    tempC,
    grind,
    targetTds,
    targetEy,
    steps,
    totalTimeSec,
    rationale,
    warnings,
  };
}

function clampToRange(value: number, range: readonly [number, number]): number {
  return Math.min(range[1], Math.max(range[0], value));
}

function computeTotalTimeSec(steps: Recipe['steps']): number {
  let max = 0;
  for (const step of steps) {
    if (step.kind === 'drawdown') max = Math.max(max, step.expectedEndSec);
    else if (step.kind === 'wait') max = Math.max(max, step.untilSec);
    else max = Math.max(max, step.atSec);
  }
  return max;
}
