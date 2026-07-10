import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';
import { user } from './auth';

/**
 * ゲストデータ取込（POST /sync/import）の冪等性確保用（docs/07 §5, docs/08 §3）。
 * クライアント生成の importId を記録し、同一importIdの再送を無視する。
 */
export const syncImports = sqliteTable('sync_imports', {
  importId: text('import_id').primaryKey(),
  userId: text('user_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull(),
});
