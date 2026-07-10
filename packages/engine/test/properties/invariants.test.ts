import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { generateRecipe } from '../../src/core/generate';
import type { BrewInput } from '../../src/schemas/input';

const roastLevelArb = fc.constantFrom(
  'light',
  'medium-light',
  'medium',
  'medium-dark',
  'dark',
) as fc.Arbitrary<BrewInput['bean']['roastLevel']>;

const processArb = fc.constantFrom(
  'washed',
  'natural',
  'honey',
  'anaerobic',
  'decaf',
  'other',
) as fc.Arbitrary<BrewInput['bean']['process']>;

const dripperIdArb = fc.constantFrom(
  'hario-v60',
  'hario-switch',
  'kalita-wave',
  'clever',
  'aeropress',
);

const tasteAxisArb = fc.integer({ min: -2, max: 2 });

const brewInputArb: fc.Arbitrary<BrewInput> = fc.record({
  bean: fc.record({
    roastLevel: roastLevelArb,
    process: processArb,
    daysOffRoast: fc.option(fc.integer({ min: 0, max: 365 }), { nil: undefined }),
    origin: fc.constant(undefined),
  }),
  equipment: fc.record({
    dripperId: dripperIdArb,
    grinderId: fc.constant(undefined),
    calibration: fc.constant(undefined),
  }),
  taste: fc.record({
    acidity: tasteAxisArb,
    sweetness: tasteAxisArb,
    bitterness: tasteAxisArb,
    body: tasteAxisArb,
    clarity: tasteAxisArb,
  }),
  strength: fc.integer({ min: -2, max: 2 }),
  targetVolumeMl: fc.integer({ min: 100, max: 1000 }),
  serveStyle: fc.constantFrom('hot', 'iced'),
  waterHardnessPpm: fc.constant(undefined),
});

describe('generateRecipe の不変条件', () => {
  it('湯温は常に 78-97°C', () => {
    fc.assert(
      fc.property(brewInputArb, (input) => {
        const recipe = generateRecipe(input);
        expect(recipe.tempC).toBeGreaterThanOrEqual(78);
        expect(recipe.tempC).toBeLessThanOrEqual(97);
      }),
    );
  });

  it('比率は 1:10-1:20 の範囲', () => {
    fc.assert(
      fc.property(brewInputArb, (input) => {
        const recipe = generateRecipe(input);
        expect(recipe.ratio).toBeGreaterThanOrEqual(10);
        expect(recipe.ratio).toBeLessThanOrEqual(20);
      }),
    );
  });

  it('EY は 17.5-22.5%', () => {
    fc.assert(
      fc.property(brewInputArb, (input) => {
        const recipe = generateRecipe(input);
        expect(recipe.targetEy).toBeGreaterThanOrEqual(17.5);
        expect(recipe.targetEy).toBeLessThanOrEqual(22.5);
      }),
    );
  });

  it('pour ステップの累計湯量は単調増加', () => {
    fc.assert(
      fc.property(brewInputArb, (input) => {
        const recipe = generateRecipe(input);
        const waterAmounts = recipe.steps.filter((s) => s.kind === 'pour').map((s) => s.toWaterG);
        for (let i = 1; i < waterAmounts.length; i++) {
          expect(waterAmounts[i]).toBeGreaterThanOrEqual(waterAmounts[i - 1] as number);
        }
      }),
    );
  });

  it('ステップの atSec は非負かつ非減少', () => {
    fc.assert(
      fc.property(brewInputArb, (input) => {
        const recipe = generateRecipe(input);
        let prev = 0;
        for (const step of recipe.steps) {
          expect(step.atSec).toBeGreaterThanOrEqual(0);
          expect(step.atSec).toBeGreaterThanOrEqual(prev - 1e-6);
          prev = step.atSec;
        }
      }),
    );
  });

  it('valve の開閉は close の後に必ず open が続く（対で整合）', () => {
    fc.assert(
      fc.property(brewInputArb, (input) => {
        const recipe = generateRecipe(input);
        const valveSteps = recipe.steps.filter((s) => s.kind === 'valve');
        let isOpen = true;
        for (const v of valveSteps) {
          if (v.state === 'closed') {
            expect(isOpen).toBe(true);
            isOpen = false;
          } else {
            isOpen = true;
          }
        }
      }),
    );
  });

  it('決定論: 同一入力は完全に同一の出力を生む', () => {
    fc.assert(
      fc.property(brewInputArb, (input) => {
        const a = generateRecipe(input);
        const b = generateRecipe(input);
        expect(a).toEqual(b);
      }),
    );
  });

  it('warnings 以外の数値に NaN が出ない', () => {
    fc.assert(
      fc.property(brewInputArb, (input) => {
        const recipe = generateRecipe(input);
        expect(Number.isNaN(recipe.tempC)).toBe(false);
        expect(Number.isNaN(recipe.doseG)).toBe(false);
        expect(Number.isNaN(recipe.waterG)).toBe(false);
        expect(Number.isNaN(recipe.ratio)).toBe(false);
        expect(Number.isNaN(recipe.grind.micron)).toBe(false);
      }),
    );
  });

  it('strength を上げると比率はおおむね締まる方向に動く（0.5g刻み丸め由来の微小な揺れは許容）', () => {
    fc.assert(
      fc.property(
        // 100ml付近の極小量は 0.5g 刻み丸めの相対誤差が大きく出るため対象外とする
        brewInputArb.filter((i) => i.strength < 2 && i.targetVolumeMl >= 150),
        (input) => {
          const base = generateRecipe(input);
          const stronger = generateRecipe({ ...input, strength: input.strength + 1 });
          expect(stronger.ratio).toBeLessThanOrEqual(base.ratio + 0.5);
        },
      ),
    );
  });
});
