import { index, integer, real, sqliteTable, text } from 'drizzle-orm/sqlite-core';
import { user } from './auth';
import { beans } from './beans';
import { recipes } from './recipes';

/** 抽出ログ（docs/07 §3.6）。プロダクトの中核テーブル。 */
export const brews = sqliteTable(
  'brews',
  {
    id: text('id').primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    recipeId: text('recipe_id').references(() => recipes.id, { onDelete: 'set null' }),
    beanId: text('bean_id').references(() => beans.id, { onDelete: 'set null' }),
    input: text('input', { mode: 'json' }).notNull(),
    output: text('output', { mode: 'json' }).notNull(),
    engineVersion: text('engine_version').notNull(),
    brewedAt: integer('brewed_at', { mode: 'timestamp_ms' }).notNull(),
    rating: real('rating'),
    tasteFeedback: text('taste_feedback', { mode: 'json' }),
    tds: real('tds'),
    actualTimeSec: integer('actual_time_sec'),
    notes: text('notes'),
  },
  (table) => [index('brews_user_id_brewed_at_idx').on(table.userId, table.brewedAt)],
);
