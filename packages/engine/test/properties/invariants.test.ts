import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { generateRecipe } from '../../src/core/generate';
import { convertMicronToSetting } from '../../src/core/grind';
import { DRIPPERS, GRINDERS, getDripper, getGrinder, ORIGIN_PROFILES } from '../../src/data';
import type { GrinderAdjustment } from '../../src/data/types';
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

// 実登録済みの全ドリッパーを対象にする（旧: 一部のみ抜粋しており aeropress-espresso /
// iwaki-mizudashi / hario-mizudashi が一度もファジングされていなかった）
const dripperIdArb = fc.constantFrom(...DRIPPERS.map((d) => d.id));

// grinderId は指定なし(一般表記のみ)も含めてファジングする。1Zpresso系(rotations表記)も
// 対象に含め、グラインダー変換コードパスも他の不変条件テストで自然にカバーされるようにする
const grinderIdArb = fc.option(fc.constantFrom(...GRINDERS.map((g) => g.id)), { nil: undefined });
const calibrationArb = fc.option(fc.record({ offset: fc.integer({ min: -20, max: 20 }) }), {
  nil: undefined,
});

const tasteAxisArb = fc.integer({ min: -2, max: 2 });

// 既知の産地名・未知の自由入力・空(未指定)のどれもファジング対象に含める
const originsArb = fc.array(
  fc.oneof(
    fc.constantFrom(...ORIGIN_PROFILES.map((o) => o.name)),
    fc.constantFrom('謎の産地', 'Unknown Farm'),
  ),
  { maxLength: 3 },
);

const brewInputArb: fc.Arbitrary<BrewInput> = fc.record({
  bean: fc.record({
    roastLevel: roastLevelArb,
    process: processArb,
    daysOffRoast: fc.option(fc.integer({ min: 0, max: 365 }), { nil: undefined }),
    origins: originsArb,
  }),
  equipment: fc.record({
    dripperId: dripperIdArb,
    grinderId: grinderIdArb,
    calibration: calibrationArb,
  }),
  taste: fc.record({
    acidity: tasteAxisArb,
    sweetness: tasteAxisArb,
    bitterness: tasteAxisArb,
    body: tasteAxisArb,
    clarity: tasteAxisArb,
  }),
  strength: fc.integer({ min: -2, max: 2 }),
  // スキーマ上の実際の最小値(30ml、AeroPress エスプレッソ風などの少量ショット)から検証する
  targetVolumeMl: fc.integer({ min: 30, max: 1000 }),
  serveStyle: fc.constantFrom('hot', 'iced'),
  waterHardnessPpm: fc.constant(undefined),
});

describe('generateRecipe の不変条件', () => {
  it('湯温は常に 78-97°C（coldDrip は冷蔵庫内温度の固定値のため対象外）', () => {
    fc.assert(
      fc.property(brewInputArb, (input) => {
        const dripper = getDripper(input.equipment.dripperId) ?? getDripper('hario-v60');
        if (!dripper) throw new Error('hario-v60 must be registered');
        const recipe = generateRecipe(input);
        if (dripper.brewType === 'coldDrip') {
          expect(recipe.tempC).toBe(4);
        } else {
          expect(recipe.tempC).toBeGreaterThanOrEqual(78);
          expect(recipe.tempC).toBeLessThanOrEqual(97);
        }
      }),
    );
  });

  it('比率はドリッパー自身の ratioRange 内に収まる（グローバル一律の範囲ではなく器具ごと）', () => {
    fc.assert(
      fc.property(brewInputArb, (input) => {
        const dripper = getDripper(input.equipment.dripperId) ?? getDripper('hario-v60');
        if (!dripper) throw new Error('hario-v60 must be registered');
        const recipe = generateRecipe(input);
        // 30ml付近の極小量では doseG の 0.5g 刻みが ratioRange の幅より粗く、
        // 範囲内に収まる doseG が存在しないことがある（実データで最大 ±0.5 を確認済み）。
        // computeRatio はその場合に逸脱量が最小になる側を選ぶため、その分だけ許容する。
        expect(recipe.ratio).toBeGreaterThanOrEqual(dripper.ratioRange[0] - 0.5);
        expect(recipe.ratio).toBeLessThanOrEqual(dripper.ratioRange[1] + 0.5);
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

  it('器具に容量上限(volumeRangeMl)がある場合、範囲外の仕上がり量を指定すると warning が出る', () => {
    const cappedDripperIds = DRIPPERS.filter((d) => d.volumeRangeMl).map((d) => d.id);
    fc.assert(
      fc.property(
        brewInputArb.filter((i) => cappedDripperIds.includes(i.equipment.dripperId)),
        (input) => {
          const dripper = getDripper(input.equipment.dripperId);
          if (!dripper?.volumeRangeMl) throw new Error('volumeRangeMl must be set here');
          const [minMl, maxMl] = dripper.volumeRangeMl;
          const recipe = generateRecipe(input);
          const outOfRange = input.targetVolumeMl < minMl || input.targetVolumeMl > maxMl;
          const hasClampWarning = recipe.warnings.some((w) => w.includes('ml'));
          expect(hasClampWarning).toBe(outOfRange);
        },
      ),
    );
  });

  it('1Zpresso系(rotations表記)のグラインダー設定は、物理的な総クリック数上限(maxTotalClicks)を超えない', () => {
    const rotationsGrinders = GRINDERS.filter((g) => g.adjustment.type === 'rotations');
    fc.assert(
      fc.property(
        fc.constantFrom(...rotationsGrinders.map((g) => g.id)),
        fc.integer({ min: 100, max: 2000 }),
        fc.integer({ min: -50, max: 50 }),
        (grinderId, micron, calibrationOffset) => {
          const grinder = getGrinder(grinderId);
          if (!grinder) throw new Error(`grinder ${grinderId} must be registered`);
          const adjustment = grinder.adjustment as Extract<
            GrinderAdjustment,
            { type: 'rotations' }
          >;
          const setting = convertMicronToSetting(micron, grinder, calibrationOffset);

          const match = setting.match(/^(\d+)周/);
          const rotations = match ? Number(match[1]) : 0;
          const maxRotations = Math.floor(adjustment.maxTotalClicks / adjustment.clicksPerRotation);
          expect(rotations).toBeLessThanOrEqual(maxRotations);

          const remainderMatch = setting.match(/(\d+)クリック/);
          const remainder = remainderMatch ? Number(remainderMatch[1]) : 0;
          expect(remainder).toBeLessThan(adjustment.clicksPerRotation);
        },
      ),
    );
  });
});
