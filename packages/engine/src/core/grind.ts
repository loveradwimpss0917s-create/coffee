import type { DripperSpec, GrinderSpec } from '../data/types';
import type { GrindResult } from '../schemas/recipe';
import type { TasteProfile } from '../schemas/taste';
import { clamp } from './pours';

const REFERENCE_VOLUME_ML = 250;

/**
 * 目標粒度(μm)の決定（docs/10 §5-(5)）。
 * ドリッパー基準値 + 総湯量補正(大バッチは粗く) + EY補正(高EY狙いで細かく) + 味の好み。
 */
export function computeTargetGrindMicron(
  dripper: DripperSpec,
  targetVolumeMl: number,
  targetEy: number,
  taste: TasteProfile,
): number {
  let micron = dripper.baseGrindMicron;
  micron += ((targetVolumeMl - REFERENCE_VOLUME_ML) / 100) * 40;
  micron += (20.0 - targetEy) * 25;
  micron += taste.clarity * 30 - taste.body * 20;
  return clamp(micron, dripper.grindRangeMicron[0], dripper.grindRangeMicron[1]);
}

const GENERAL_LABEL_THRESHOLDS: Array<{ maxMicron: number; label: string }> = [
  { maxMicron: 300, label: '極細挽き' },
  { maxMicron: 500, label: '細挽き' },
  { maxMicron: 700, label: '中細挽き' },
  { maxMicron: 900, label: '中挽き' },
  { maxMicron: 1100, label: '中粗挽き' },
  { maxMicron: Number.POSITIVE_INFINITY, label: '粗挽き' },
];

export function micronToGeneralLabel(micron: number): string {
  const found = GENERAL_LABEL_THRESHOLDS.find((t) => micron <= t.maxMicron);
  return found?.label ?? '中挽き';
}

/**
 * μm → グラインダー目盛/クリック変換（docs/11 §3）。
 * calibrationOffset はユーザー実測によるオフセット補正（docs/11 §5）。
 */
export function convertMicronToSetting(
  micron: number,
  grinder: GrinderSpec,
  calibrationOffset = 0,
): string {
  const { adjustment } = grinder;

  if (adjustment.type === 'clicks') {
    const raw = (micron - adjustment.zeroOffsetMicron) / adjustment.micronPerStep;
    const steps = clamp(Math.round(raw) + calibrationOffset, 0, adjustment.maxSteps);
    return `${steps} クリック`;
  }

  if (adjustment.type === 'numbered') {
    const raw = (micron - adjustment.zeroOffsetMicron) / adjustment.micronPerStep;
    const stepped = Math.round(raw / adjustment.stepSize) * adjustment.stepSize + calibrationOffset;
    const setting = clamp(stepped, adjustment.minSetting, adjustment.maxSetting);
    return `目盛 ${formatNumber(setting)}`;
  }

  // rotations: 1Zpresso 系の「N周+Mクリック」表記
  const micronPerClick = adjustment.micronPerRotation / adjustment.clicksPerRotation;
  const totalClicks =
    Math.round((micron - adjustment.zeroOffsetMicron) / micronPerClick) + calibrationOffset;
  const clampedClicks = Math.max(0, totalClicks);
  const rotations = Math.floor(clampedClicks / adjustment.clicksPerRotation);
  const remainder = clampedClicks % adjustment.clicksPerRotation;
  return rotations > 0 ? `${rotations}周 + ${remainder}クリック` : `${remainder}クリック`;
}

function formatNumber(value: number): string {
  return Number.isInteger(value) ? String(value) : value.toFixed(1);
}

export function buildGrindResult(
  micron: number,
  grinder: GrinderSpec | undefined,
  calibrationOffset: number | undefined,
): GrindResult {
  const generalLabel = `${micronToGeneralLabel(micron)}（約${Math.round(micron)}μm）`;
  if (!grinder) {
    return { micron, generalLabel };
  }
  return {
    micron,
    generalLabel,
    setting: convertMicronToSetting(micron, grinder, calibrationOffset ?? 0),
    confidence: grinder.confidence,
  };
}
