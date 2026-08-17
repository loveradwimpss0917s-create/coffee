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
import { computeOriginAdjustment } from './origin';
import { COLD_DRIP_TEMP_C, computeTemperatureC } from './temperature';

/**
 * レシピ生成のメインパイプライン（docs/10 §5）。
 * 決定論・純粋関数・throw しない設計。未登録の器具IDは既定値にフォールバックし
 * warnings に記録する（入力バリデーション自体は呼び出し側の Zod 境界で完了済み前提、docs/08 §4）。
 */
export function generateRecipe(input: BrewInput, _options: GenerateOptions = {}): Recipe {
  const warnings: string[] = [];

  // (1) resolve
  const dripperLookup = getDripper(input.equipment.dripperId);
  const dripper = dripperLookup ?? harioV60;
  if (!dripperLookup) {
    warnings.push(
      `未登録のドリッパーID「${input.equipment.dripperId}」のため HARIO V60 の設定で生成しました。`,
    );
  }

  const isColdDrip = dripper.brewType === 'coldDrip';
  // カフェラテ等のミルクドリンクは「氷でコーヒー自体を薄める」既存の仕組みとは別物
  // （氷が入るのはミルク/グラス側で、コーヒーの抽出には影響しない）ため、
  // 通常の isIced 補正(希釈計算・warnings)からは除外し、Hot/Iced の違いは
  // dripper.buildSteps 側でミルクの温度(スチーム/冷たい)としてのみ扱う
  const isMilkDrink = dripper.brewType === 'milkDrink';
  const isIced = input.serveStyle === 'iced' && !isColdDrip && !isMilkDrink;
  if (input.serveStyle === 'iced' && isColdDrip) {
    warnings.push('水出しはもともと冷たいため、アイスの設定は反映されません。');
  }
  if (input.serveStyle === 'iced' && isMilkDrink) {
    warnings.push('あらかじめ氷を入れたグラスを用意してください。');
  }

  const grinder = input.equipment.grinderId ? getGrinder(input.equipment.grinderId) : undefined;
  if (input.equipment.grinderId && !grinder) {
    warnings.push(
      `未登録のグラインダーID「${input.equipment.grinderId}」のため一般表記(μm)のみ表示します。`,
    );
  }

  // 器具そのものの容量を超える仕上がり量は、実際に淹れられる範囲へ寄せる（例: AeroPress は最大250ml）
  let targetVolumeMl = input.targetVolumeMl;
  if (dripper.volumeRangeMl) {
    const [minMl, maxMl] = dripper.volumeRangeMl;
    targetVolumeMl = clampToRange(input.targetVolumeMl, dripper.volumeRangeMl);
    if (targetVolumeMl !== input.targetVolumeMl) {
      warnings.push(
        `${dripper.name}は${minMl}〜${maxMl}ml向けの器具のため、仕上がり量を${targetVolumeMl}mlとして計算しました。`,
      );
    }
  }

  // 産地(複数可・ブレンド対応)による目標EY/湯温への小さな補正（docs/10 §5-(2), §5-(4)）
  const originAdjustment = computeOriginAdjustment(input.bean.origins);
  if (originAdjustment.unmatchedRaw.length > 0) {
    warnings.push(
      `産地「${originAdjustment.unmatchedRaw.join('・')}」は認識できなかったため、産地に応じた補正は反映されていません。`,
    );
  }

  // (2) targets
  let targetTds = computeTargetTds(input.strength);
  const targetEy = computeTargetEy(
    input.taste,
    input.bean.roastLevel,
    input.bean.process,
    originAdjustment.deltaEy,
  );
  if (isIced) targetTds = applyIcedTdsAdjustment(targetTds);

  // (3) ratio
  const {
    doseG,
    waterG: totalWaterG,
    ratio,
  } = computeRatio(targetVolumeMl, targetTds, targetEy, dripper.lrr, dripper.ratioRange);

  let brewWaterG = totalWaterG;
  if (isIced) {
    const split = computeIcedWaterSplit(totalWaterG);
    brewWaterG = split.brewWaterG;
    warnings.push(`サーバーにあらかじめ氷 ${split.iceG}g を入れてください。`);
  }

  // (4) temperature
  let tempC = isColdDrip
    ? COLD_DRIP_TEMP_C
    : computeTemperatureC(
        input.bean.roastLevel,
        input.bean.process,
        input.taste,
        dripper.tempOffsetC,
        input.bean.daysOffRoast,
        originAdjustment.tempOffsetC,
      );
  if (isIced) tempC = applyIcedTempAdjustment(tempC);

  // (5) grind
  let grindMicron = computeTargetGrindMicron(dripper, targetVolumeMl, targetEy, input.taste);
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
    targetVolumeMl,
  });

  // (7) validate
  if (isIced) {
    // 透過型は数分かけて氷の上に少しずつ落ちるため自然と混ざるが、浸漬(弁を閉じる)/加圧型は
    // 最後にまとめて氷に触れるだけで混ざりが不十分になりやすい。HARIO Switch のように
    // 同じ器具でも taste ベクトルで実際のモードが変わる場合があるため、dripper.brewType の
    // 静的な値ではなく、実際に生成された steps（浸漬区間の有無）で判定する
    const hasImmersionContact = steps.some(
      (step) => (step.kind === 'valve' && step.state === 'closed') || step.kind === 'press',
    );
    if (hasImmersionContact) {
      warnings.push(
        '抽出後、氷とよくかき混ぜてから飲んでください。混ざりが足りないとぬるく感じます。',
      );
    }
  }
  const totalTimeSec = computeTotalTimeSec(steps);

  // (8) explain
  const rationale = buildRationale({
    input,
    dripper,
    targetTds,
    targetEy,
    tempC,
    isIced,
    originMatchedNames: originAdjustment.matchedNames,
  });

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
    else if (step.kind === 'press') max = Math.max(max, step.atSec + step.durationSec);
    else max = Math.max(max, step.atSec);
  }
  return max;
}
