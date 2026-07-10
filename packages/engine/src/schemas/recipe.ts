import { z } from 'zod';
import { brewInputSchema } from './input';

/**
 * 注湯スケジュールの1ステップ。docs/10 §5-(6) の discriminated union。
 * atSec は生成開始(0:00)からの経過秒。pour の waterG は「累計」湯量。
 */
export const pourStepSchema = z.object({
  kind: z.literal('pour'),
  atSec: z.number().min(0),
  toWaterG: z.number().min(0),
  note: z.enum(['center', 'circular', 'edge']).optional(),
});

export const bloomStepSchema = z.object({
  kind: z.literal('bloom'),
  atSec: z.number().min(0),
  waterG: z.number().min(0),
  durationSec: z.number().min(0),
});

export const waitStepSchema = z.object({
  kind: z.literal('wait'),
  atSec: z.number().min(0),
  untilSec: z.number().min(0),
});

export const stirStepSchema = z.object({
  kind: z.literal('stir'),
  atSec: z.number().min(0),
  method: z.enum(['swirl', 'spoon']),
});

export const valveStepSchema = z.object({
  kind: z.literal('valve'),
  atSec: z.number().min(0),
  state: z.enum(['open', 'closed']),
});

export const pressStepSchema = z.object({
  kind: z.literal('press'),
  atSec: z.number().min(0),
  durationSec: z.number().min(0),
});

export const temperatureChangeStepSchema = z.object({
  kind: z.literal('temperatureChange'),
  atSec: z.number().min(0),
  toTempC: z.number(),
});

export const drawdownStepSchema = z.object({
  kind: z.literal('drawdown'),
  atSec: z.number().min(0),
  expectedEndSec: z.number().min(0),
});

export const recipeStepSchema = z.discriminatedUnion('kind', [
  pourStepSchema,
  bloomStepSchema,
  waitStepSchema,
  stirStepSchema,
  valveStepSchema,
  pressStepSchema,
  temperatureChangeStepSchema,
  drawdownStepSchema,
]);
export type RecipeStep = z.infer<typeof recipeStepSchema>;

/** 生成根拠。text はテンプレートID+パラメータで保持し表示時に文章化する（docs/10 §5-(8), i18n対応） */
export const rationaleSchema = z.object({
  paramKey: z.enum(['strength', 'temperature', 'grind', 'pours', 'switchMode', 'iced', 'general']),
  templateId: z.string(),
  params: z.record(z.string(), z.union([z.string(), z.number()])).default({}),
  sourceRefs: z.array(z.string()).default([]),
});
export type Rationale = z.infer<typeof rationaleSchema>;

export const grindResultSchema = z.object({
  micron: z.number(),
  /** 一般表記ラベル（例: '中細挽き'） */
  generalLabel: z.string(),
  /** グラインダー目盛/クリック表記。grinderId 未指定時は undefined */
  setting: z.string().optional(),
  confidence: z.enum(['measured', 'community', 'estimated']).optional(),
});
export type GrindResult = z.infer<typeof grindResultSchema>;

export const recipeSchema = z.object({
  engineVersion: z.string(),
  input: brewInputSchema,
  dripperId: z.string(),
  doseG: z.number(),
  waterG: z.number(),
  ratio: z.number(),
  tempC: z.number(),
  grind: grindResultSchema,
  targetTds: z.number(),
  targetEy: z.number(),
  steps: z.array(recipeStepSchema),
  totalTimeSec: z.number(),
  rationale: z.array(rationaleSchema),
  warnings: z.array(z.string()).default([]),
});
export type Recipe = z.infer<typeof recipeSchema>;
