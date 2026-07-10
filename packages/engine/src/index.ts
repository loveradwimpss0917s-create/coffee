/**
 * @coffee-lab/engine 公開API。
 * フレームワーク非依存の純粋 TypeScript パッケージ（依存は zod のみ、docs/02 §2）。
 */

import type { Recipe } from './schemas/recipe';
import { recipeSchema } from './schemas/recipe';

export { computeIcedWaterSplit } from './core/adjustments';
export { computeRatio, computeTargetEy, computeTargetTds } from './core/extraction';
export { generateRecipe } from './core/generate';
export { buildGrindResult, convertMicronToSetting, micronToGeneralLabel } from './core/grind';
export { computeTemperatureC } from './core/temperature';

export { DRIPPERS, GRINDERS, getDripper, getGrinder } from './data';
export type { DripperSpec, GrinderSpec } from './data/types';
export type {
  BeanInput,
  BrewInput,
  EquipmentInput,
  GenerateOptions,
  GrinderCalibration,
  Process,
  RoastLevel,
  ServeStyle,
} from './schemas/input';
export {
  beanInputSchema,
  brewInputSchema,
  equipmentInputSchema,
  grinderCalibrationSchema,
  processSchema,
  roastLevelSchema,
  serveStyleSchema,
} from './schemas/input';
export type { GrindResult, Rationale, Recipe, RecipeStep } from './schemas/recipe';
export { recipeSchema, recipeStepSchema } from './schemas/recipe';
export type { TasteAxis, TasteProfile } from './schemas/taste';
export {
  BALANCED_TASTE_PROFILE,
  TASTE_AXIS_KEYS,
  TASTE_PRESETS,
  tasteProfileSchema,
} from './schemas/taste';

export { ENGINE_VERSION } from './version';

/**
 * 旧バージョンの保存済み Recipe JSON を現行スキーマへアップキャストする。
 * 現時点(0.1.0)は初回リリースのため恒等変換のみ。将来のスキーマ変更時に
 * ここへバージョン別の移行ロジックを追加する（docs/10 §10）。
 */
export function migrateRecipeJson(json: unknown): Recipe {
  return recipeSchema.parse(json);
}
