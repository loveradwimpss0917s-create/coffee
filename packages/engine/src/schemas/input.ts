import { z } from 'zod';
import { tasteProfileSchema } from './taste';

export const roastLevelSchema = z.enum(['light', 'medium-light', 'medium', 'medium-dark', 'dark']);
export type RoastLevel = z.infer<typeof roastLevelSchema>;

export const processSchema = z.enum(['washed', 'natural', 'honey', 'anaerobic', 'decaf', 'other']);
export type Process = z.infer<typeof processSchema>;

export const serveStyleSchema = z.enum(['hot', 'iced']);
export type ServeStyle = z.infer<typeof serveStyleSchema>;

export const beanInputSchema = z.object({
  roastLevel: roastLevelSchema,
  process: processSchema.default('washed'),
  /** 焙煎からの経過日数。ガス抜け具合の補正に使う（docs/10 §5-(4)） */
  daysOffRoast: z.number().int().min(0).max(365).optional(),
  origin: z.string().max(120).optional(),
});
export type BeanInput = z.infer<typeof beanInputSchema>;

/** グラインダー個体のキャリブレーション補正（docs/11 §5） */
export const grinderCalibrationSchema = z.object({
  /** 目盛/クリックの加算オフセット */
  offset: z.number().default(0),
});
export type GrinderCalibration = z.infer<typeof grinderCalibrationSchema>;

export const equipmentInputSchema = z.object({
  /** packages/engine/src/data/drippers に登録された ID */
  dripperId: z.string().min(1),
  /** packages/engine/src/data/grinders に登録された ID。未指定は一般表記(μm)のみ出力 */
  grinderId: z.string().min(1).optional(),
  calibration: grinderCalibrationSchema.optional(),
});
export type EquipmentInput = z.infer<typeof equipmentInputSchema>;

export const brewInputSchema = z.object({
  bean: beanInputSchema,
  equipment: equipmentInputSchema,
  taste: tasteProfileSchema,
  /** 濃度(TDS)の好み。味5軸とは独立（docs/10 §4.2） */
  strength: z.number().min(-2).max(2).default(0),
  /** 30ml台〜: AeroPress エスプレッソ風(docs/11)等、少量の濃縮ショットにも対応 */
  targetVolumeMl: z.number().min(30).max(1000).default(250),
  serveStyle: serveStyleSchema.default('hot'),
  waterHardnessPpm: z.number().min(0).max(500).optional(),
});
export type BrewInput = z.infer<typeof brewInputSchema>;

export type GenerateOptions = {
  /** trace を Recipe に含めるか（デバッグ・explain 生成に使用、既定 true） */
  includeTrace?: boolean;
};
