import type { BuildStepsParams, FlowClass } from '../data/types';
import type { RecipeStep } from '../schemas/recipe';

/**
 * 注湯構造の共通ヘルパー。各ドリッパーの `buildSteps` から呼び出される。
 * 4:6 メソッド（Tetsu Kasuya, World Brewers Cup 2016）に基づき、
 * 「序盤(蒸らし含む):終盤」の比率で酸味/甘さを、投数で濃度/攪拌を設計する（docs/10 §5-(6)）。
 */

const POUR_INTERVAL_SEC: Record<FlowClass, number> = {
  fast: 35,
  medium: 45,
  slow: 60,
};

/** 蒸らし湯量。粉量の 2.5〜3.0 倍。焙煎からの日数が浅いほど多め（ガス抜け対応） */
export function computeBloomWaterG(doseG: number, daysOffRoast: number | undefined): number {
  const freshnessBonus = daysOffRoast !== undefined && daysOffRoast < 5 ? 0.25 : 0;
  return round1(doseG * (2.75 + freshnessBonus));
}

export function computeBloomDurationSec(daysOffRoast: number | undefined): number {
  return daysOffRoast !== undefined && daysOffRoast < 5 ? 45 : 40;
}

/**
 * 蒸らし後の投数。2〜5投。濃度・苦味の好みが高いほど攪拌回数(=投数)を増やす。
 * Iced は酸化・過冷却を避けるため早めに落とし切る（投数-1、docs/10 §7）。
 */
export function computePourCount(
  strength: number,
  bitterness: number,
  waterG: number,
  isIced = false,
): number {
  const raw = 2 + (strength + bitterness) / 2 + waterG / 150 - (isIced ? 1 : 0);
  return clamp(Math.round(raw), 2, 5);
}

/**
 * 序盤(蒸らし含む)の湯量比率。酸味の好み+ / 甘さの好み- で序盤を厚くする（4:6理論）。
 */
export function computeFirstPhaseRatio(acidity: number, sweetness: number): number {
  const raw = 0.4 + acidity * 0.05 - sweetness * 0.05;
  return clamp(raw, 0.3, 0.6);
}

export type PercolationTuning = {
  flowClass: FlowClass;
  drawdownBaseSec: number;
};

/**
 * 透過型（V60 / Kalita / ORIGAMI 等）の共通テンプレート。
 * bloom -> 序盤 pour(複数) -> 終盤 pour(複数) -> drawdown。
 */
export function buildPercolationSteps(
  params: BuildStepsParams,
  tuning: PercolationTuning,
): RecipeStep[] {
  const { doseG, waterG, taste, strength, daysOffRoast } = params;
  const steps: RecipeStep[] = [];

  const bloomWaterG = Math.min(computeBloomWaterG(doseG, daysOffRoast), waterG * 0.3);
  const bloomDurationSec = computeBloomDurationSec(daysOffRoast);
  const interval = POUR_INTERVAL_SEC[tuning.flowClass];

  steps.push({ kind: 'bloom', atSec: 0, waterG: bloomWaterG, durationSec: bloomDurationSec });

  const pourCount = computePourCount(
    strength,
    taste.bitterness,
    waterG,
    params.serveStyle === 'iced',
  );
  const firstPhaseRatio = computeFirstPhaseRatio(taste.acidity, taste.sweetness);
  const firstPhaseTargetG = waterG * firstPhaseRatio;

  // 蒸らしを含めた累計湯量を pourCount 回に分けて到達させる
  const remainingAfterBloom = waterG - bloomWaterG;
  const firstPhasePours = Math.max(1, Math.round(pourCount * firstPhaseRatio));
  const secondPhasePours = Math.max(1, pourCount - firstPhasePours);

  let cumulative = bloomWaterG;
  let atSec = bloomDurationSec;

  const firstPhaseIncrement = Math.max(0, firstPhaseTargetG - bloomWaterG) / firstPhasePours;
  for (let i = 0; i < firstPhasePours; i++) {
    cumulative = round1(cumulative + firstPhaseIncrement);
    steps.push({ kind: 'pour', atSec, toWaterG: cumulative, note: 'circular' });
    atSec += interval;
  }

  const secondPhaseIncrement = Math.max(0, waterG - cumulative) / secondPhasePours;
  for (let i = 0; i < secondPhasePours; i++) {
    cumulative = i === secondPhasePours - 1 ? waterG : round1(cumulative + secondPhaseIncrement);
    steps.push({ kind: 'pour', atSec, toWaterG: cumulative, note: 'center' });
    atSec += interval;
  }

  const drawdownDuration = Math.round(tuning.drawdownBaseSec * (waterG / 250));
  steps.push({ kind: 'drawdown', atSec, expectedEndSec: atSec + drawdownDuration });

  void remainingAfterBloom;
  return steps;
}

export type ImmersionTuning = {
  /** 基準浸漬秒数（250ml時） */
  steepBaseSec: number;
  hasValve: boolean;
};

/**
 * 浸漬型（Clever Dripper 等）の共通テンプレート。
 * 閉/投入 -> 攪拌 -> 浸漬 -> 開放/drawdown。
 */
export function buildImmersionSteps(
  params: BuildStepsParams,
  tuning: ImmersionTuning,
): RecipeStep[] {
  const { doseG, waterG, taste, daysOffRoast } = params;
  const steps: RecipeStep[] = [];

  if (tuning.hasValve) {
    steps.push({ kind: 'valve', atSec: 0, state: 'closed' });
  }
  steps.push({
    kind: 'bloom',
    atSec: 0,
    waterG: computeBloomWaterG(doseG, daysOffRoast),
    durationSec: computeBloomDurationSec(daysOffRoast),
  });
  steps.push({ kind: 'pour', atSec: computeBloomDurationSec(daysOffRoast), toWaterG: waterG });
  steps.push({
    kind: 'stir',
    atSec: computeBloomDurationSec(daysOffRoast) + 5,
    method: 'spoon',
  });

  const steepSec = clamp(
    Math.round(tuning.steepBaseSec * (waterG / 250) + taste.body * 30 - taste.clarity * 20),
    60,
    360,
  );
  const steepEndSec = computeBloomDurationSec(daysOffRoast) + 10 + steepSec;
  steps.push({
    kind: 'wait',
    atSec: computeBloomDurationSec(daysOffRoast) + 10,
    untilSec: steepEndSec,
  });

  if (tuning.hasValve) {
    steps.push({ kind: 'valve', atSec: steepEndSec, state: 'open' });
  }
  steps.push({ kind: 'drawdown', atSec: steepEndSec, expectedEndSec: steepEndSec + 60 });

  return steps;
}

export type PressTuning = {
  steepBaseSec: number;
};

/** 加圧型（AeroPress）の共通テンプレート */
export function buildPressSteps(params: BuildStepsParams, tuning: PressTuning): RecipeStep[] {
  const { doseG, waterG, taste, daysOffRoast } = params;
  const steps: RecipeStep[] = [];
  const bloomDurationSec = computeBloomDurationSec(daysOffRoast);

  steps.push({
    kind: 'bloom',
    atSec: 0,
    waterG: computeBloomWaterG(doseG, daysOffRoast),
    durationSec: bloomDurationSec,
  });
  steps.push({ kind: 'pour', atSec: bloomDurationSec, toWaterG: waterG });
  steps.push({ kind: 'stir', atSec: bloomDurationSec + 5, method: 'spoon' });

  const steepSec = clamp(
    Math.round(tuning.steepBaseSec + taste.body * 15 - taste.clarity * 10),
    30,
    180,
  );
  const pressAtSec = bloomDurationSec + 10 + steepSec;
  steps.push({ kind: 'press', atSec: pressAtSec, durationSec: 25 });

  return steps;
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function round1(value: number): number {
  return Math.round(value * 10) / 10;
}
