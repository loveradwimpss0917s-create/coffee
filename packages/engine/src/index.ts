/**
 * @coffee-lab/engine 公開API。
 * フレームワーク非依存の純粋 TypeScript パッケージ（依存は zod のみ、docs/02 §2）。
 */

import type { Recipe } from './schemas/recipe';
import { recipeSchema } from './schemas/recipe';

export { computeIcedWaterSplit } from './core/adjustments';
export { computeRatio, computeTargetEy, computeTargetTds } from './core/extraction';
export type { FeedbackEntry } from './core/feedback';
export { adjustFromFeedback } from './core/feedback';
export { generateRecipe } from './core/generate';
export { buildGrindResult, convertMicronToSetting, micronToGeneralLabel } from './core/grind';
export type { OriginAdjustment } from './core/origin';
export { computeOriginAdjustment } from './core/origin';
export { computeTemperatureC } from './core/temperature';

export { DRIPPERS, GRINDERS, getDripper, getGrinder, ORIGIN_PROFILES } from './data';
export type { OriginProfile } from './data/origins';
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
 * bean.origin(単一の産地文字列) → bean.origins(配列) への移行（産地補正の追加、docs/10 §10）。
 * 保存済みの Recipe JSON(input.bean.origin) はこの形をまだ持ちうるため、
 * 新スキーマの parse に通す前に不足分を補う。
 */
function migrateLegacyOrigin(json: unknown): unknown {
  if (typeof json !== 'object' || json === null) return json;
  const input = (json as Record<string, unknown>).input;
  if (typeof input !== 'object' || input === null) return json;
  const bean = (input as Record<string, unknown>).bean;
  if (typeof bean !== 'object' || bean === null) return json;
  const beanRecord = bean as Record<string, unknown>;
  if (Array.isArray(beanRecord.origins)) return json; // 移行済み

  const legacyOrigin = beanRecord.origin;
  const migratedBean =
    typeof legacyOrigin === 'string' && legacyOrigin.trim()
      ? { ...beanRecord, origins: [legacyOrigin] }
      : { ...beanRecord, origins: [] };

  return {
    ...(json as Record<string, unknown>),
    input: { ...(input as Record<string, unknown>), bean: migratedBean },
  };
}

/**
 * 旧バージョンの保存済み Recipe JSON を現行スキーマへアップキャストする。
 * 将来のスキーマ変更時はここへバージョン別の移行ロジックを追加していく（docs/10 §10）。
 */
export function migrateRecipeJson(json: unknown): Recipe {
  return recipeSchema.parse(migrateLegacyOrigin(json));
}
