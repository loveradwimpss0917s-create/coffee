import { describe, expect, it } from 'vitest';
import { computeRatio, computeTargetEy, computeTargetTds } from '../../src/core/extraction';
import { BALANCED_TASTE_PROFILE } from '../../src/schemas/taste';

describe('computeTargetTds', () => {
  it('strength 0 でベース値(1.32%)を返す', () => {
    expect(computeTargetTds(0)).toBeCloseTo(1.32, 2);
  });

  it('strength を上げると濃度目標が上がる', () => {
    expect(computeTargetTds(2)).toBeGreaterThan(computeTargetTds(0));
    expect(computeTargetTds(-2)).toBeLessThan(computeTargetTds(0));
  });

  it('SCA Golden Cup の実用域(1.10-1.55%)に収まる', () => {
    expect(computeTargetTds(2)).toBeLessThanOrEqual(1.55);
    expect(computeTargetTds(-2)).toBeGreaterThanOrEqual(1.1);
  });
});

describe('computeTargetEy', () => {
  it('バランス指定・washed・medium でベース近辺(20%)を返す', () => {
    const ey = computeTargetEy(BALANCED_TASTE_PROFILE, 'medium', 'washed');
    expect(ey).toBeCloseTo(20.0, 1);
  });

  it('酸味を上げると EY が下がる（酸味は序盤重視で低EY狙い）', () => {
    const low = computeTargetEy({ ...BALANCED_TASTE_PROFILE, acidity: 2 }, 'medium', 'washed');
    const base = computeTargetEy(BALANCED_TASTE_PROFILE, 'medium', 'washed');
    expect(low).toBeLessThan(base);
  });

  it('苦味を上げると EY が上がる', () => {
    const high = computeTargetEy({ ...BALANCED_TASTE_PROFILE, bitterness: 2 }, 'medium', 'washed');
    const base = computeTargetEy(BALANCED_TASTE_PROFILE, 'medium', 'washed');
    expect(high).toBeGreaterThan(base);
  });

  it('深煎りは EY 目標が下がる', () => {
    const dark = computeTargetEy(BALANCED_TASTE_PROFILE, 'dark', 'washed');
    const medium = computeTargetEy(BALANCED_TASTE_PROFILE, 'medium', 'washed');
    expect(dark).toBeLessThan(medium);
  });

  it('SCA 実用域(17.5-22.5%)に収まる', () => {
    const ey = computeTargetEy(
      { acidity: -2, sweetness: 2, bitterness: 2, body: 2, clarity: -2 },
      'light',
      'natural',
    );
    expect(ey).toBeLessThanOrEqual(22.5);
    expect(ey).toBeGreaterThanOrEqual(17.5);
  });
});

describe('computeRatio', () => {
  const v60RatioRange: [number, number] = [14, 17];

  it('250ml・TDS1.32・EY20 で妥当な比率(1:14-1:17)を返す', () => {
    const { doseG, waterG, ratio } = computeRatio(250, 1.32, 20.0, 2.0, v60RatioRange);
    expect(doseG).toBeGreaterThan(10);
    expect(waterG).toBeGreaterThan(doseG);
    expect(ratio).toBeGreaterThanOrEqual(14);
    expect(ratio).toBeLessThanOrEqual(17);
  });

  it('doseG は 0.5g刻み、waterG は 5g刻み', () => {
    const { doseG, waterG } = computeRatio(250, 1.32, 20.0, 2.0, v60RatioRange);
    expect((doseG * 2) % 1).toBeCloseTo(0, 5);
    expect(waterG % 5).toBe(0);
  });

  it('strength を上げると比率が締まる（水が相対的に減る）', () => {
    const loose = computeRatio(250, 1.15, 20.0, 2.0, v60RatioRange);
    const tight = computeRatio(250, 1.5, 20.0, 2.0, v60RatioRange);
    expect(tight.ratio).toBeLessThanOrEqual(loose.ratio);
  });

  it('ratioRange を外れる組合せは境界付近へ補正される（0.5g刻み丸めのため若干の余裕を許容）', () => {
    // 極端に薄い TDS/高い EY で通常なら 1:23 超になるが、range上限付近まで clamp される
    const unclamped = computeRatio(120, 1.1, 22.5, 2.0, [0, 100]);
    const { ratio } = computeRatio(120, 1.1, 22.5, 2.0, v60RatioRange);
    expect(ratio).toBeLessThan(unclamped.ratio);
    expect(ratio).toBeLessThanOrEqual(v60RatioRange[1] + 0.5);
  });
});
