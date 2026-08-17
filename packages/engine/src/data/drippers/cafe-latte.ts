import { buildEspressoSteps } from '../../core/pours';
import type { RecipeStep } from '../../schemas/recipe';
import type { BuildStepsParams, DripperSpec } from '../types';

/**
 * カフェラテ。AeroPress エスプレッソ風（aeropress-espresso）と同じ濃縮ショットを
 * ベースに、ミルクを加えて仕上げる。Hot/Iced の切り替えはミルクの温度（スチーム/冷たい）
 * にのみ反映し、ショット自体の抽出条件（湯温・比率・粒度）は変えない。
 * 氷が入るのはミルク/グラス側であり、通常の Iced 器具のように「氷でコーヒー自体を
 * 希釈する」わけではないため、generate.ts の isIced 補正の対象からは除外している
 * （brewType: 'milkDrink'、docs/10 §6.3）。
 *
 * ミルク量はショット量(targetVolumeMl)に比例させる。家庭向けの一般的なカフェラテ
 * レシピを参考にした目安比率（ショット:ミルク）:
 *   Hot  ≈ 1:4    （例: 45ml ショット → 約180gのスチームミルクで、8oz程度のカフェラテに）
 *   Iced ≈ 1:3.5  （グラスの氷が体積を占める分、ミルクはやや控えめにする）
 */
const HOT_MILK_RATIO = 4;
const ICED_MILK_RATIO = 3.5;

function buildMilkStep(params: BuildStepsParams, atSec: number): RecipeStep {
  const isIced = params.serveStyle === 'iced';
  const ratio = isIced ? ICED_MILK_RATIO : HOT_MILK_RATIO;
  const milkG = Math.round(params.targetVolumeMl * ratio);
  return { kind: 'addMilk', atSec, milkG, temperature: isIced ? 'cold' : 'steamed' };
}

function buildCafeLatteSteps(params: BuildStepsParams): RecipeStep[] {
  const shotSteps = buildEspressoSteps(params, { steepBaseSec: 40, pressDurationSec: 20 });
  const lastStep = shotSteps[shotSteps.length - 1];
  const pressEndSec =
    lastStep && lastStep.kind === 'press' ? lastStep.atSec + lastStep.durationSec : 0;
  return [...shotSteps, buildMilkStep(params, pressEndSec + 5)];
}

export const cafeLatte: DripperSpec = {
  id: 'cafe-latte',
  name: 'カフェラテ',
  brewType: 'milkDrink',
  geometry: 'cylinder',
  baseGrindMicron: 350,
  grindRangeMicron: [250, 450],
  tempOffsetC: 0,
  lrr: 1.3,
  flowModel: { drawdownBaseSec: 0, flowClass: 'fast' },
  ratioRange: [2, 3],
  features: ['press', 'inverted-capable'],
  // ここでの仕上がり量は「エスプレッソショットの量」。ミルクの量はショット量に比例して別途算出する
  volumeRangeMl: [30, 100],
  buildSteps: buildCafeLatteSteps,
  notes:
    'AeroPressで濃縮ショットを淹れ、仕上がり量（ショット量）に応じたミルクを注いでカフェラテにします。Hot/Icedでミルクの温度が変わります（Icedは氷を入れたグラスを別途ご用意ください）。',
};
