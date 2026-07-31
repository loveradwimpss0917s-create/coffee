import type { Process, RoastLevel } from '../schemas/input';
import type { TasteProfile } from '../schemas/taste';
import { clamp, round1 } from './pours';

/**
 * 目標 TDS(濃度) / EY(抽出収率) の決定。
 * SCA Golden Cup: TDS 1.15-1.35%, EY 18-22% が官能的にバランスする領域
 * （SCA Brewing Control Chart）。本エンジンはこの領域を中心に、
 * strength と味5軸で目標値を動かす（docs/10 §5-(2)）。
 */

const BASE_TDS_PERCENT = 1.32;
const BASE_EY_PERCENT = 20.0;

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

export function computeTargetTds(strength: number): number {
  return clamp(round2(BASE_TDS_PERCENT + strength * 0.09), 1.1, 1.55);
}

export function computeTargetEy(
  taste: TasteProfile,
  roastLevel: RoastLevel,
  process: Process,
): number {
  let deltaEy = 0;
  deltaEy += taste.acidity * -0.4;
  deltaEy += Math.max(taste.sweetness, 0) * 0.2;
  deltaEy += taste.bitterness * 0.5;
  deltaEy += taste.clarity * -0.3;
  deltaEy += taste.body * 0.1;

  if (roastLevel === 'dark') deltaEy -= 0.8;
  else if (roastLevel === 'medium-dark') deltaEy -= 0.4;

  if (process === 'natural' || process === 'anaerobic') deltaEy -= 0.5;

  return clamp(round1(BASE_EY_PERCENT + deltaEy), 17.5, 22.5);
}

export type RatioResult = {
  doseG: number;
  waterG: number;
  ratio: number;
};

const DOSE_STEP_G = 0.5;

/**
 * LRR(液体保持率)モデルによる質量計算（docs/10 §5-(3)）。
 * EY = beverageG * TDS / doseG の逆算で doseG を求め、
 * waterG は仕上がり量 + 粉が保持する液体量(doseG * lrr) から算出する。
 *
 * 算出後の比率がドリッパーの実用域(ratioRange)を外れる場合（極端な仕上がり量や
 * strength での丸め誤差）は、waterG(仕上がり量ベース)を保ったまま doseG を
 * ratioRange の境界に収まる範囲へ補正する。
 * ただし少量バッチでは 0.5g 刻みの粒度が ratioRange の幅より粗く、範囲内に収まる
 * doseG が存在しないことがある。その場合は「境界の外側に押し出す」のではなく、
 * 範囲外への逸脱量が最小になる側の doseG を選ぶ（docs/10 §5-(3)）。
 */
export function computeRatio(
  targetVolumeMl: number,
  targetTds: number,
  targetEy: number,
  lrr: number,
  ratioRange: readonly [number, number],
): RatioResult {
  const beverageG = targetVolumeMl;
  const rawDoseG = (beverageG * (targetTds / 100)) / (targetEy / 100);
  const doseG = Math.round(rawDoseG / DOSE_STEP_G) * DOSE_STEP_G; // 0.5g 刻み
  const rawWaterG = beverageG + doseG * lrr;
  const waterG = Math.round(rawWaterG / 5) * 5; // 5g 刻み
  const ratio = round1(waterG / doseG);

  if (ratio >= ratioRange[0] && ratio <= ratioRange[1]) {
    return { doseG, waterG, ratio };
  }

  // ratio が ratioRange[0]..ratioRange[1] に入る連続的な doseG の区間
  const validMinDoseG = waterG / ratioRange[1];
  const validMaxDoseG = waterG / ratioRange[0];

  // その区間に入る 0.5g 刻みの候補のうち、区間の下端・上端に最も近いもの
  const quantizedLow = Math.ceil(validMinDoseG / DOSE_STEP_G) * DOSE_STEP_G;
  const quantizedHigh = Math.floor(validMaxDoseG / DOSE_STEP_G) * DOSE_STEP_G;

  let adjustedDoseG: number;
  if (quantizedLow <= quantizedHigh) {
    // 区間内に収まる 0.5g 刻みの値が存在する。rawDoseG に最も近いものを選ぶ
    adjustedDoseG = clamp(
      Math.round(rawDoseG / DOSE_STEP_G) * DOSE_STEP_G,
      quantizedLow,
      quantizedHigh,
    );
  } else {
    // 0.5g 刻みでは区間に収まる値が存在しない（区間が 0.5g 幅より狭い）。
    // doseG 側ではなく実際に制約したい ratio 側の逸脱量で比較する
    // （ratio = waterG/doseG は非線形なので、dose の近さと ratio の近さは一致しない）
    const violationAtHigh = waterG / quantizedHigh - ratioRange[1];
    const violationAtLow = ratioRange[0] - waterG / quantizedLow;
    adjustedDoseG = violationAtHigh <= violationAtLow ? quantizedHigh : quantizedLow;
  }
  adjustedDoseG = Math.max(DOSE_STEP_G, adjustedDoseG);

  return { doseG: adjustedDoseG, waterG, ratio: round1(waterG / adjustedDoseG) };
}
