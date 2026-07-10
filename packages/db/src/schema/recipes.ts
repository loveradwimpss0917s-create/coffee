import { index, integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';
import { user } from './auth';
import { beans } from './beans';

/**
 * 保存レシピ（docs/07 §3.5）。input/output はエンジンの Zod スキーマを JSON 文字列で保存し、
 * 読み出し時に parse する（DB は生 JSON を保持するのみ、docs/07 §1）。
 */
export const recipes = sqliteTable(
  'recipes',
  {
    id: text('id').primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    beanId: text('bean_id').references(() => beans.id, { onDelete: 'set null' }),
    title: text('title').notNull(),
    input: text('input', { mode: 'json' }).notNull(),
    output: text('output', { mode: 'json' }).notNull(),
    engineVersion: text('engine_version').notNull(),
    dripperId: text('dripper_id').notNull(),
    isIced: integer('is_iced', { mode: 'boolean' }).notNull().default(false),
    visibility: text('visibility', { enum: ['private', 'unlisted', 'public'] })
      .notNull()
      .default('private'),
    shareId: text('share_id').unique(),
    source: text('source', { enum: ['generated', 'manual', 'official', 'competition'] })
      .notNull()
      .default('generated'),
    createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull(),
  },
  (table) => [
    index('recipes_user_id_created_idx').on(table.userId, table.createdAt),
    index('recipes_dripper_id_idx').on(table.dripperId),
  ],
);
