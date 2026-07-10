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
    origin: text('origin'),
    variety: text('variety'),
    process: text('process').notNull(),
    roastLevel: text('roast_level').notNull(),
    roastDate: integer('roast_date', { mode: 'timestamp_ms' }),
    notes: text('notes'),
    photoKey: text('photo_key'),
    archivedAt: integer('archived_at', { mode: 'timestamp_ms' }),
    createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull(),
    updatedAt: integer('updated_at', { mode: 'timestamp_ms' }).notNull(),
  },
  (table) => [index('beans_user_id_archived_idx').on(table.userId, table.archivedAt)],
);
