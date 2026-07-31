import type { TasteProfile } from '../schemas/taste';
import { TASTE_AXIS_KEYS } from '../schemas/taste';
import { clamp } from './pours';

/**
 * フィードバックループ（β）。docs/10 §8。
 * ある抽出で「狙った味(targetTaste = そのとき input.taste に入れた値)」と
 * 「実際に感じた味(feltTaste = フィードバック画面で入力した値)」の差分(error)から、
 * 次回同じドリッパーで淹れるときの taste 入力を補正する。
 *
 * 生成パイプライン(generate.ts)自体は変更しない。「入力への差分」を返すだけなので、
 * 呼び出し側（apps/web）が次回の BrewInput.taste にマージして generateRecipe に渡す。
 */
export type FeedbackEntry = {
  targetTaste: TasteProfile;
  feltTaste: TasteProfile;
};

/** 直近何件を補正に使うか */
const HISTORY_LIMIT = 3;
/** 直近を手厚く、古いものほど軽く重みづけする指数加重（先頭が最新） */
const HISTORY_WEIGHTS = [0.5, 0.3, 0.2];
/** この誤差(平均, -4..+4スケール)未満なら補正しない（ノイズ・単発のブレを無視） */
const ERROR_THRESHOLD = 0.75;

/**
 * 直近のフィードバック履歴から、次回の taste 入力への補正パッチを計算する。
 * 各軸は独立に評価し、1回あたり ±1 ステップまでしか動かさない（発散防止、docs/10 §8）。
 * 例: 苦味を感じた量が狙いより大きければ(error>0)、次回は苦味の狙いを1段階下げる
 * → 既存の computeTemperatureC / computeTargetEy の苦味係数を通じて自然に湯温・EYが下がる。
 */
export function adjustFromFeedback(history: FeedbackEntry[]): Partial<TasteProfile> {
  const recent = history.slice(0, HISTORY_LIMIT);
  const latest = recent[0];
  if (!latest) return {};

  const patch: Partial<TasteProfile> = {};

  for (const axis of TASTE_AXIS_KEYS) {
    let weightedError = 0;
    let weightSum = 0;
    recent.forEach((entry, i) => {
      const weight = HISTORY_WEIGHTS[i] ?? 0;
      weightedError += weight * (entry.feltTaste[axis] - entry.targetTaste[axis]);
      weightSum += weight;
    });
    if (weightSum === 0) continue;

    const avgError = weightedError / weightSum;
    if (Math.abs(avgError) < ERROR_THRESHOLD) continue;

    // 感じた量が狙いより多かった(error>0)ら次回の狙いを下げる、少なければ上げる
    const step = avgError > 0 ? -1 : 1;
    const baseline = latest.targetTaste[axis];
    patch[axis] = clamp(baseline + step, -2, 2);
  }

  return patch;
}
