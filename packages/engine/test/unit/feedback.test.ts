import { describe, expect, it } from 'vitest';
import { adjustFromFeedback, type FeedbackEntry } from '../../src/core/feedback';
import { BALANCED_TASTE_PROFILE } from '../../src/schemas/taste';

function entry(target: number, felt: number): FeedbackEntry {
  return {
    targetTaste: { ...BALANCED_TASTE_PROFILE, bitterness: target },
    feltTaste: { ...BALANCED_TASTE_PROFILE, bitterness: felt },
  };
}

describe('adjustFromFeedback', () => {
  it('履歴が空なら何も補正しない', () => {
    expect(adjustFromFeedback([])).toEqual({});
  });

  it('狙いより苦く感じ続けたら次回の苦味の狙いを1段階下げる', () => {
    // 苦味 target 0 に対して felt +2 が3件続く → 明確に苦すぎ
    const history = [entry(0, 2), entry(0, 2), entry(0, 2)];
    const patch = adjustFromFeedback(history);
    expect(patch.bitterness).toBe(-1);
  });

  it('狙いより苦味が足りないと感じ続けたら次回の苦味の狙いを1段階上げる', () => {
    const history = [entry(0, -2), entry(0, -2), entry(0, -2)];
    const patch = adjustFromFeedback(history);
    expect(patch.bitterness).toBe(1);
  });

  it('誤差が小さければ補正しない（ノイズ扱い）', () => {
    const history = [entry(0, 0), entry(0, 1), entry(0, 0)];
    const patch = adjustFromFeedback(history);
    expect(patch.bitterness).toBeUndefined();
  });

  it('直近の狙いを基準にclampする（既に+2で、さらに感じ足りない場合は+2のまま）', () => {
    const history = [entry(2, -2), entry(2, -2)];
    const patch = adjustFromFeedback(history);
    expect(patch.bitterness).toBe(2);
  });

  it('直近ほど重みが大きい（直近が逆方向なら結果も引きずられる）', () => {
    // 古い2件は「苦すぎ」(+2)、直近1件は逆に「苦味不足」(-2)
    // → 重み0.5の直近が効いて加重平均は0になり、誤差は閾値未満になる
    const history = [entry(0, -2), entry(0, 2), entry(0, 2)];
    const patch = adjustFromFeedback(history);
    expect(patch.bitterness).toBeUndefined();
  });

  it('5軸それぞれ独立に補正する', () => {
    const history: FeedbackEntry[] = [
      {
        targetTaste: { acidity: 0, sweetness: 0, bitterness: 0, body: 0, clarity: 0 },
        feltTaste: { acidity: 2, sweetness: -2, bitterness: 0, body: 2, clarity: -2 },
      },
      {
        targetTaste: { acidity: 0, sweetness: 0, bitterness: 0, body: 0, clarity: 0 },
        feltTaste: { acidity: 2, sweetness: -2, bitterness: 0, body: 2, clarity: -2 },
      },
    ];
    const patch = adjustFromFeedback(history);
    expect(patch).toEqual({ acidity: -1, sweetness: 1, body: -1, clarity: 1 });
  });
});
