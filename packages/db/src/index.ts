import { drizzle } from 'drizzle-orm/d1';
import * as schema from './schema';

/** D1 バインディングから Drizzle クライアントを作る唯一の入口（docs/02: DBアクセスはDrizzle経由のみ）。 */
export function createDb(d1: D1Database) {
  return drizzle(d1, { schema });
}

export type Db = ReturnType<typeof createDb>;

export * from './schema';
export { schema };
