import { integer, real, sqliteTable, text } from 'drizzle-orm/sqlite-core';
import { user } from './auth';

/**
 * ユーザー設定（docs/07 §3.2）。
 * apps/web の `UserSettings`（lib/schemas.ts）とフィールドを1:1対応させ、
 * ApiRepository でのマッピングを単純に保つ（docs/09 §4）。
 * 複数グラインダーの個別キャリブレーションは v1.0 で拡張予定（docs/11 §5）。
 */
export const userSettings = sqliteTable('user_settings', {
  userId: text('user_id')
    .primaryKey()
    .references(() => user.id, { onDelete: 'cascade' }),
  ownedDripperIds: text('owned_dripper_ids', { mode: 'json' }).notNull().default('[]'),
  defaultGrinderId: text('default_grinder_id'),
  grinderCalibrationOffset: real('grinder_calibration_offset').notNull().default(0),
  defaultTasteProfile: text('default_taste_profile', { mode: 'json' }).notNull(),
  theme: text('theme', { enum: ['system', 'light', 'dark'] })
    .notNull()
    .default('system'),
  onboarded: integer('onboarded', { mode: 'boolean' }).notNull().default(false),
});
