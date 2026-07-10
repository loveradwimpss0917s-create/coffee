import { z } from 'zod';

/**
 * 味覚5軸。-2..+2 の整数。0 がバランス。
 * docs/10-recipe-engine.md §4 参照。
 */
export const tasteAxisSchema = z.number().int().min(-2).max(2);

export const tasteProfileSchema = z.object({
  acidity: tasteAxisSchema.default(0),
  sweetness: tasteAxisSchema.default(0),
  bitterness: tasteAxisSchema.default(0),
  body: tasteAxisSchema.default(0),
  clarity: tasteAxisSchema.default(0),
});

export type TasteAxis = z.infer<typeof tasteAxisSchema>;
export type TasteProfile = z.infer<typeof tasteProfileSchema>;

export const TASTE_AXIS_KEYS = ['acidity', 'sweetness', 'bitterness', 'body', 'clarity'] as const;

export const BALANCED_TASTE_PROFILE: TasteProfile = {
  acidity: 0,
  sweetness: 0,
  bitterness: 0,
  body: 0,
  clarity: 0,
};

/** docs/06 S02 のプリセットチップ。satisfies でリテラルキーを保持し undefined 化を避ける */
export const TASTE_PRESETS = {
  brightFloral: { acidity: 2, sweetness: 1, bitterness: -1, body: -1, clarity: 2 },
  balanced: BALANCED_TASTE_PROFILE,
  richDeep: { acidity: -1, sweetness: 1, bitterness: 1, body: 2, clarity: -1 },
  sweetnessFocused: { acidity: -1, sweetness: 2, bitterness: 0, body: 1, clarity: 0 },
} satisfies Record<string, TasteProfile>;
