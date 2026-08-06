import {
  brewInputSchema,
  processSchema,
  recipeSchema,
  roastLevelSchema,
  tasteProfileSchema,
} from '@coffee-lab/engine';
import { z } from 'zod';

/**
 * アプリ側（クライアント）のローカルエンティティ定義。
 * サーバー同期(D1)導入まではこのスキーマがそのまま localStorage の保存形式になる（docs/09 §4）。
 */

export const beanSchema = z.object({
  id: z.string(),
  name: z.string().min(1).max(80),
  roaster: z.string().max(80).optional(),
  /**
   * 産地（自由入力 + サジェスト）。ブレンドは複数選択できる（docs/07 §3.4）。
   * 旧形式(単一の origin 文字列)の localStorage データは、この欄が無いだけなので
   * デフォルト値([])で吸収する（産地情報は失われるが、ゲスト専用データのため許容する。
   * サーバー同期済みのデータは DB マイグレーションで origins へ引き継がれる）。
   */
  origins: z.array(z.string().max(60)).max(5).default([]),
  variety: z.string().max(80).optional(),
  process: processSchema,
  roastLevel: roastLevelSchema,
  roastDate: z.number().optional(),
  notes: z.string().max(1000).optional(),
  archivedAt: z.number().optional(),
  createdAt: z.number(),
  updatedAt: z.number(),
});
export type Bean = z.infer<typeof beanSchema>;

export const userSettingsSchema = z.object({
  ownedDripperIds: z.array(z.string()).default([]),
  defaultGrinderId: z.string().optional(),
  grinderCalibrationOffset: z.number().default(0),
  defaultTasteProfile: tasteProfileSchema,
  theme: z.enum(['system', 'light', 'dark']).default('system'),
  onboarded: z.boolean().default(false),
});
export type UserSettings = z.infer<typeof userSettingsSchema>;

export const DEFAULT_SETTINGS: UserSettings = {
  ownedDripperIds: [],
  defaultGrinderId: undefined,
  grinderCalibrationOffset: 0,
  defaultTasteProfile: { acidity: 0, sweetness: 0, bitterness: 0, body: 0, clarity: 0 },
  theme: 'system',
  onboarded: false,
};

export const savedRecipeSchema = z.object({
  id: z.string(),
  beanId: z.string().optional(),
  title: z.string().min(1).max(120),
  input: brewInputSchema,
  output: recipeSchema,
  createdAt: z.number(),
});
export type SavedRecipe = z.infer<typeof savedRecipeSchema>;

export const brewSchema = z.object({
  id: z.string(),
  recipeId: z.string().optional(),
  beanId: z.string().optional(),
  input: brewInputSchema,
  output: recipeSchema,
  brewedAt: z.number(),
  rating: z.number().min(0.5).max(5).optional(),
  tasteFeedback: tasteProfileSchema.optional(),
  tds: z.number().optional(),
  actualTimeSec: z.number().optional(),
  notes: z.string().max(1000).optional(),
});
export type Brew = z.infer<typeof brewSchema>;
