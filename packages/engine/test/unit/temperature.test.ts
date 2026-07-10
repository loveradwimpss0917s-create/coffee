import { describe, expect, it } from 'vitest';
import { computeTemperatureC } from '../../src/core/temperature';
import { BALANCED_TASTE_PROFILE } from '../../src/schemas/taste';

describe('computeTemperatureC', () => {
  it('浅煎りは深煎りより高温になる', () => {
    const light = computeTemperatureC('light', 'washed', BALANCED_TASTE_PROFILE, 0, undefined);
    const dark = computeTemperatureC('dark', 'washed', BALANCED_TASTE_PROFILE, 0, undefined);
    expect(light).toBeGreaterThan(dark);
  });

  it('ナチュラル/嫌気性は washed より低温になる', () => {
    const washed = computeTemperatureC('medium', 'washed', BALANCED_TASTE_PROFILE, 0, undefined);
    const natural = computeTemperatureC('medium', 'natural', BALANCED_TASTE_PROFILE, 0, undefined);
    expect(natural).toBeLessThan(washed);
  });

  it('苦味の好みを上げると温度が上がる', () => {
    const base = computeTemperatureC('medium', 'washed', BALANCED_TASTE_PROFILE, 0, undefined);
    const bitter = computeTemperatureC(
      'medium',
      'washed',
      { ...BALANCED_TASTE_PROFILE, bitterness: 2 },
      0,
      undefined,
    );
    expect(bitter).toBeGreaterThan(base);
  });

  it('常に 78-97°C の範囲に収まる', () => {
    const extremeLow = computeTemperatureC(
      'dark',
      'natural',
      { acidity: -2, sweetness: -2, bitterness: -2, body: -2, clarity: 2 },
      -3,
      3,
    );
    const extremeHigh = computeTemperatureC(
      'light',
      'washed',
      { acidity: 2, sweetness: 2, bitterness: 2, body: 2, clarity: -2 },
      3,
      40,
    );
    expect(extremeLow).toBeGreaterThanOrEqual(78);
    expect(extremeHigh).toBeLessThanOrEqual(97);
  });

  it('0.5°C 刻みに丸められる', () => {
    const tempC = computeTemperatureC('medium', 'washed', BALANCED_TASTE_PROFILE, 0, undefined);
    expect((tempC * 2) % 1).toBeCloseTo(0, 5);
  });
});
