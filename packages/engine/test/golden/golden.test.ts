import { describe, expect, it } from 'vitest';
import { generateRecipe } from '../../src/core/generate';
import type { BrewInput } from '../../src/schemas/input';
import { BALANCED_TASTE_PROFILE, TASTE_PRESETS } from '../../src/schemas/taste';

/**
 * ゴールデンテスト（docs/14 §2.1）。
 * 係数を変更する PR ではこのスナップショットの差分が「レシピがどう変わるか」の
 * レビュー材料になる。更新は `pnpm --filter @coffee-lab/engine test -- -u` + PR説明必須。
 *
 * 初期セット: 5ドリッパー × 代表的な味の好み + Iced + 極端値。
 * 30ケースへの拡充はロードマップ M1タスク1-6で継続する。
 */

function makeInput(
  overrides: Partial<Omit<BrewInput, 'bean'>> &
    Pick<BrewInput, 'equipment'> & { bean?: Partial<BrewInput['bean']> },
): BrewInput {
  const { bean, ...rest } = overrides;
  return {
    bean: { roastLevel: 'medium', process: 'washed', origins: [], ...bean },
    taste: BALANCED_TASTE_PROFILE,
    strength: 0,
    targetVolumeMl: 250,
    serveStyle: 'hot',
    ...rest,
  };
}

describe('golden: V60', () => {
  it('浅煎り・washed・バランス', () => {
    const input = makeInput({
      bean: { roastLevel: 'light', process: 'washed' },
      equipment: { dripperId: 'hario-v60' },
    });
    expect(generateRecipe(input)).toMatchSnapshot();
  });

  it('深煎り・ナチュラル・コク深い好み', () => {
    const input = makeInput({
      bean: { roastLevel: 'dark', process: 'natural' },
      equipment: { dripperId: 'hario-v60' },
      taste: TASTE_PRESETS.richDeep,
    });
    expect(generateRecipe(input)).toMatchSnapshot();
  });

  it('明るく華やかな好み', () => {
    const input = makeInput({
      bean: { roastLevel: 'light', process: 'washed' },
      equipment: { dripperId: 'hario-v60' },
      taste: TASTE_PRESETS.brightFloral,
    });
    expect(generateRecipe(input)).toMatchSnapshot();
  });
});

describe('golden: Kalita Wave', () => {
  it('中煎り・honey・バランス', () => {
    const input = makeInput({
      bean: { roastLevel: 'medium', process: 'honey' },
      equipment: { dripperId: 'kalita-wave' },
    });
    expect(generateRecipe(input)).toMatchSnapshot();
  });
});

describe('golden: HARIO Switch 360（3モード）', () => {
  it('クリア感優位 -> 透過主体モード', () => {
    const input = makeInput({
      equipment: { dripperId: 'hario-switch' },
      taste: { acidity: 0, sweetness: 0, bitterness: 0, body: -1, clarity: 2 },
    });
    const recipe = generateRecipe(input);
    expect(recipe.steps.some((s) => s.kind === 'valve' && s.state === 'closed')).toBe(false);
    expect(recipe).toMatchSnapshot();
  });

  it('ボディ優位 -> 浸漬主体モード', () => {
    const input = makeInput({
      equipment: { dripperId: 'hario-switch' },
      taste: { acidity: 0, sweetness: 0, bitterness: 0, body: 2, clarity: -1 },
    });
    const recipe = generateRecipe(input);
    expect(recipe.steps.some((s) => s.kind === 'valve' && s.state === 'closed')).toBe(true);
    expect(recipe).toMatchSnapshot();
  });

  it('バランス -> ハイブリッドモード（Kasuya型・二段温度）', () => {
    const input = makeInput({ equipment: { dripperId: 'hario-switch' } });
    const recipe = generateRecipe(input);
    expect(recipe.steps.some((s) => s.kind === 'temperatureChange')).toBe(true);
    expect(recipe).toMatchSnapshot();
  });
});

describe('golden: Clever Dripper（浸漬）', () => {
  it('中煎り・バランス', () => {
    const input = makeInput({ equipment: { dripperId: 'clever' } });
    expect(generateRecipe(input)).toMatchSnapshot();
  });
});

describe('golden: AeroPress（加圧）', () => {
  it('中煎り・バランス', () => {
    const input = makeInput({ equipment: { dripperId: 'aeropress' } });
    expect(generateRecipe(input)).toMatchSnapshot();
  });
});

describe('golden: AeroPress エスプレッソ風（少量濃縮）', () => {
  it('60ml・中煎り・バランス', () => {
    const input = makeInput({
      equipment: { dripperId: 'aeropress-espresso' },
      targetVolumeMl: 60,
    });
    const recipe = generateRecipe(input);
    expect(recipe.steps.map((s) => s.kind)).toEqual(['pour', 'stir', 'press']);
    expect(recipe.ratio).toBeLessThanOrEqual(3);
    expect(recipe.grind.micron).toBeLessThan(500);
    expect(recipe).toMatchSnapshot();
  });
});

describe('golden: カフェラテ（ミルクドリンク）', () => {
  it('Hot・60mlショット・中煎り・バランス', () => {
    const input = makeInput({
      equipment: { dripperId: 'cafe-latte' },
      targetVolumeMl: 60,
    });
    const recipe = generateRecipe(input);
    expect(recipe.steps.map((s) => s.kind)).toEqual(['pour', 'stir', 'press', 'addMilk']);
    const milkStep = recipe.steps.find((s) => s.kind === 'addMilk');
    expect(milkStep?.kind === 'addMilk' && milkStep.temperature).toBe('steamed');
    expect(milkStep?.kind === 'addMilk' && milkStep.milkG).toBe(240); // 60ml * 4
    expect(recipe.warnings).toEqual([]);
    expect(recipe).toMatchSnapshot();
  });

  it('Iced・60mlショット・中煎り・バランス（氷でコーヒー自体は薄めない）', () => {
    const input = makeInput({
      equipment: { dripperId: 'cafe-latte' },
      targetVolumeMl: 60,
      serveStyle: 'iced',
    });
    const hotInput = makeInput({ equipment: { dripperId: 'cafe-latte' }, targetVolumeMl: 60 });
    const iced = generateRecipe(input);
    const hot = generateRecipe(hotInput);

    const milkStep = iced.steps.find((s) => s.kind === 'addMilk');
    expect(milkStep?.kind === 'addMilk' && milkStep.temperature).toBe('cold');
    expect(milkStep?.kind === 'addMilk' && milkStep.milkG).toBe(210); // 60ml * 3.5

    // 氷はミルク/グラス側であり、ショット自体の抽出条件(湯量・湯温)は Hot と変わらない
    expect(iced.waterG).toBe(hot.waterG);
    expect(iced.tempC).toBe(hot.tempC);
    expect(iced.warnings.some((w) => w.includes('氷'))).toBe(true);
    expect(iced.warnings.some((w) => w.includes('かき混ぜ'))).toBe(false);
    expect(iced).toMatchSnapshot();
  });
});

describe('golden: AeroPress（容量上限クランプ）', () => {
  it('チャンバー容量(250ml)を超える指定は250mlへクランプされ warning が出る', () => {
    const input = makeInput({
      equipment: { dripperId: 'aeropress' },
      targetVolumeMl: 600,
    });
    const recipe = generateRecipe(input);
    expect(recipe.warnings.some((w) => w.includes('250'))).toBe(true);
    // クランプ後の実際の仕上がり量(250ml)を基準に doseG/waterG が計算されているはず。
    // 600ml のまま計算されていた場合、AeroPress の ratioRange[12,16] のもとでは
    // doseG は 40g 近くになり、250ml 基準(15〜16g程度)とは明確に区別できる
    expect(recipe.doseG).toBeLessThan(25);
    expect(recipe).toMatchSnapshot();
  });
});

describe('golden: ORIGAMI', () => {
  it('中煎り・バランス', () => {
    const input = makeInput({ equipment: { dripperId: 'origami' } });
    expect(generateRecipe(input)).toMatchSnapshot();
  });
});

describe('golden: CAFEC フラワー', () => {
  it('浅煎り・明るく華やかな好み', () => {
    const input = makeInput({
      bean: { roastLevel: 'light', process: 'washed' },
      equipment: { dripperId: 'cafec-flower' },
      taste: TASTE_PRESETS.brightFloral,
    });
    expect(generateRecipe(input)).toMatchSnapshot();
  });
});

describe('golden: KONO 名門', () => {
  it('中煎り・バランス', () => {
    const input = makeInput({ equipment: { dripperId: 'kono' } });
    expect(generateRecipe(input)).toMatchSnapshot();
  });
});

describe('golden: April Brewer', () => {
  it('浅煎り・バランス', () => {
    const input = makeInput({
      bean: { roastLevel: 'light', process: 'washed' },
      equipment: { dripperId: 'april' },
    });
    expect(generateRecipe(input)).toMatchSnapshot();
  });
});

describe('golden: Orea Brewer', () => {
  it('中煎り・バランス', () => {
    const input = makeInput({ equipment: { dripperId: 'orea' } });
    expect(generateRecipe(input)).toMatchSnapshot();
  });
});

describe('golden: 産地補正', () => {
  it('エチオピア(単一産地)は補正なしより低EY・やや高温になり、Rationaleに産地が出る', () => {
    const withoutOrigin = generateRecipe(
      makeInput({ equipment: { dripperId: 'hario-v60' }, bean: { origins: [] } }),
    );
    const withOrigin = generateRecipe(
      makeInput({ equipment: { dripperId: 'hario-v60' }, bean: { origins: ['エチオピア'] } }),
    );
    expect(withOrigin.targetEy).toBeLessThan(withoutOrigin.targetEy);
    expect(withOrigin.tempC).toBeGreaterThan(withoutOrigin.tempC);
    expect(
      withOrigin.rationale.some(
        (r) => r.templateId === 'origin.profileAdjust' && r.params.originNames === 'エチオピア',
      ),
    ).toBe(true);
    expect(withOrigin).toMatchSnapshot();
  });

  it('ブレンド(複数産地)は Rationale に両方の名前が表示される', () => {
    const input = makeInput({
      equipment: { dripperId: 'hario-v60' },
      bean: { origins: ['エチオピア', 'ブラジル'] },
    });
    const recipe = generateRecipe(input);
    const rationale = recipe.rationale.find((r) => r.templateId === 'origin.profileAdjust');
    expect(rationale?.params.originNames).toBe('エチオピア・ブラジル');
  });

  it('未知の産地表記は補正されず、認識できなかった旨の warning が出る', () => {
    const input = makeInput({
      equipment: { dripperId: 'hario-v60' },
      bean: { origins: ['謎の農園X'] },
    });
    const recipe = generateRecipe(input);
    expect(recipe.warnings.some((w) => w.includes('謎の農園X') && w.includes('認識'))).toBe(true);
    expect(recipe.rationale.some((r) => r.templateId === 'origin.profileAdjust')).toBe(false);
  });
});

describe('golden: French Press（全浸漬）', () => {
  it('中煎り・コク深い好み', () => {
    const input = makeInput({
      equipment: { dripperId: 'french-press' },
      taste: TASTE_PRESETS.richDeep,
    });
    const recipe = generateRecipe(input);
    expect(recipe.steps.some((s) => s.kind === 'press')).toBe(true);
    expect(recipe).toMatchSnapshot();
  });
});

describe('golden: Iced', () => {
  it('浅煎り・Iced・250ml', () => {
    const input = makeInput({
      bean: { roastLevel: 'light', process: 'washed' },
      equipment: { dripperId: 'hario-v60' },
      serveStyle: 'iced',
    });
    const recipe = generateRecipe(input);
    expect(recipe.warnings.some((w) => w.includes('かき混ぜ'))).toBe(false);
    expect(recipe).toMatchSnapshot();
  });

  it('AeroPress・Iced・250ml（浸漬/加圧型は氷が混ざりにくいためwarningを追加）', () => {
    const input = makeInput({
      equipment: { dripperId: 'aeropress' },
      serveStyle: 'iced',
    });
    const recipe = generateRecipe(input);
    expect(recipe.warnings.some((w) => w.includes('かき混ぜ'))).toBe(true);
    expect(recipe).toMatchSnapshot();
  });

  it('HARIO Switch・Iced・クリア感優位(透過主体モード)は実際のモードで判定しwarningを出さない', () => {
    const input = makeInput({
      equipment: { dripperId: 'hario-switch' },
      taste: { acidity: 0, sweetness: 0, bitterness: 0, body: -1, clarity: 2 },
      serveStyle: 'iced',
    });
    const recipe = generateRecipe(input);
    // dripper.brewType は静的には 'hybrid' だが、taste ベクトルから実際に選ばれるのは
    // 弁を閉じない透過主体モードのため、氷は継続的に混ざる → warning は不要
    expect(recipe.steps.some((s) => s.kind === 'valve' && s.state === 'closed')).toBe(false);
    expect(recipe.warnings.some((w) => w.includes('かき混ぜ'))).toBe(false);
    expect(recipe).toMatchSnapshot();
  });

  it('HARIO Switch・Iced・ボディ優位(浸漬主体モード)は実際のモードで判定しwarningを出す', () => {
    const input = makeInput({
      equipment: { dripperId: 'hario-switch' },
      taste: { acidity: 0, sweetness: 0, bitterness: 0, body: 2, clarity: -1 },
      serveStyle: 'iced',
    });
    const recipe = generateRecipe(input);
    expect(recipe.steps.some((s) => s.kind === 'valve' && s.state === 'closed')).toBe(true);
    expect(recipe.warnings.some((w) => w.includes('かき混ぜ'))).toBe(true);
    expect(recipe).toMatchSnapshot();
  });

  it('HARIO Switch・Iced・バランス(ハイブリッドモード)も弁を閉じる区間があるためwarningを出す', () => {
    const input = makeInput({
      equipment: { dripperId: 'hario-switch' },
      serveStyle: 'iced',
    });
    const recipe = generateRecipe(input);
    expect(recipe.steps.some((s) => s.kind === 'valve' && s.state === 'closed')).toBe(true);
    expect(recipe.warnings.some((w) => w.includes('かき混ぜ'))).toBe(true);
    expect(recipe).toMatchSnapshot();
  });
});

describe('golden: グラインダー併記', () => {
  it('Comandante C40 指定時に目盛が併記される', () => {
    const input = makeInput({
      equipment: { dripperId: 'hario-v60', grinderId: 'comandante-c40' },
    });
    const recipe = generateRecipe(input);
    expect(recipe.grind.setting).toBeDefined();
    expect(recipe).toMatchSnapshot();
  });

  it("De'Longhi KG521J-M 指定時は confidence: estimated", () => {
    const input = makeInput({
      equipment: { dripperId: 'hario-v60', grinderId: 'delonghi-kg521' },
    });
    const recipe = generateRecipe(input);
    expect(recipe.grind.confidence).toBe('estimated');
    expect(recipe).toMatchSnapshot();
  });

  it.each([
    '1zpresso-jx-pro',
    '1zpresso-zp6',
    'baratza-encore',
    'fellow-ode2',
    'wilfa-svart',
    'niche-zero',
    'df64',
    'mahlkonig-ek43',
  ])('%s 指定時に目盛が併記される', (grinderId) => {
    const input = makeInput({ equipment: { dripperId: 'hario-v60', grinderId } });
    const recipe = generateRecipe(input);
    expect(recipe.grind.setting).toBeDefined();
    expect(recipe).toMatchSnapshot();
  });
});

describe('golden: coldDrip（点滴式水出し）', () => {
  it('iwaki-mizudashi・バランス', () => {
    const input = makeInput({
      equipment: { dripperId: 'iwaki-mizudashi' },
    });
    const recipe = generateRecipe(input);
    expect(recipe.tempC).toBe(4);
    expect(recipe.steps.map((s) => s.kind)).toEqual(['pour', 'wait']);
    expect(recipe).toMatchSnapshot();
  });

  it('hario-mizudashi・アイス指定は無視されwarningが出る', () => {
    const input = makeInput({
      equipment: { dripperId: 'hario-mizudashi' },
      serveStyle: 'iced',
    });
    const recipe = generateRecipe(input);
    expect(recipe.tempC).toBe(4);
    expect(recipe.warnings.some((w) => w.includes('アイス'))).toBe(true);
    expect(recipe).toMatchSnapshot();
  });
});

describe('golden: 極端値・大量抽出', () => {
  it('1000ml・強い好み全部盛り', () => {
    const input = makeInput({
      equipment: { dripperId: 'kalita-wave' },
      targetVolumeMl: 1000,
      strength: 2,
      taste: { acidity: 2, sweetness: 2, bitterness: 2, body: 2, clarity: 2 },
    });
    expect(generateRecipe(input)).toMatchSnapshot();
  });

  it('未登録ドリッパーIDはV60にフォールバックしwarningを出す', () => {
    const input = makeInput({ equipment: { dripperId: 'unknown-dripper' } });
    const recipe = generateRecipe(input);
    expect(recipe.dripperId).toBe('hario-v60');
    expect(recipe.warnings.length).toBeGreaterThan(0);
  });
});
