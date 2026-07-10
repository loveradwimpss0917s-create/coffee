import { createId } from '@/lib/id';
import { type Brew, brewSchema } from '@/lib/schemas';
import { createLocalStore } from '@/lib/storage';
import type { LogRepository } from './repository';

const store = createLocalStore<Brew>('coffee-lab:brews', brewSchema, 1);

export const localLogRepository: LogRepository = {
  async list() {
    return store.list().sort((a, b) => b.brewedAt - a.brewedAt);
  },
  async get(id) {
    return store.list().find((b) => b.id === id);
  },
  async create(input) {
    const brew: Brew = { ...input, id: createId('brw') };
    store.save([...store.list(), brew]);
    return brew;
  },
  async update(id, patch) {
    const items = store.list();
    const index = items.findIndex((b) => b.id === id);
    if (index === -1) return undefined;
    const updated: Brew = { ...(items[index] as Brew), ...patch };
    const next = [...items];
    next[index] = updated;
    store.save(next);
    return updated;
  },
  async remove(id) {
    store.save(store.list().filter((b) => b.id !== id));
  },
};

/** アカウント同期後にゲストデータを消去する(features/auth/sync.ts から使用)。 */
export function clearLocalBrews(): void {
  store.save([]);
}
