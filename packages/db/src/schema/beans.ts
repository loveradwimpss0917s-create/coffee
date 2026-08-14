import { index, integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';
import { user } from './auth';

/** 豆（docs/07 §3.4）。roastLevel/process の値は @coffee-lab/engine の enum と一致させる。 */
export const beans = sqliteTable(
  'beans',
  {
    id: text('id').primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    roaster: text('roaster'),
    /** 産地（自由入力 + サジェスト）の配列。ブレンドは複数産地を持てる（docs/07 §3.4） */
    origins: text('origins', { mode: 'json' }).notNull().default('[]').$type<string[]>(),
    variety: text('variety'),
    // 値は packages/engine の processSchema/roastLevelSchema と一致させる（型推論のみ、DB上はTEXT）
    process: text('process', {
      enum: ['washed', 'natural', 'honey', 'anaerobic', 'decaf', 'other'],
    }).notNull(),
    roastLevel: text('roast_level', {
      enum: ['light', 'medium-light', 'medium', 'medium-dark', 'dark'],
    }).notNull(),
    roastDate: integer('roast_date', { mode: 'timestamp_ms' }),
    notes: text('notes'),
    photoKey: text('photo_key'),
    archivedAt: integer('archived_at', { mode: 'timestamp_ms' }),
    createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull(),
    updatedAt: integer('updated_at', { mode: 'timestamp_ms' }).notNull(),
  },
  (table) => [index('beans_user_id_archived_idx').on(table.userId, table.archivedAt)],
);
