import { createId } from '@/lib/id';
import { type Bean, beanSchema } from '@/lib/schemas';
import { createLocalStore } from '@/lib/storage';
import type { BeansRepository } from './repository';

const store = createLocalStore<Bean>('coffee-lab:beans', beanSchema, 1);

export const localBeansRepository: BeansRepository = {
  async list() {
    return store.list().sort((a, b) => b.createdAt - a.createdAt);
  },
  async get(id) {
    return store.list().find((b) => b.id === id);
  },
  async create(input) {
    const now = Date.now();
    const bean: Bean = { ...input, id: createId('ben'), createdAt: now, updatedAt: now };
    store.save([...store.list(), bean]);
    return bean;
  },
  async update(id, patch) {
    const items = store.list();
    const index = items.findIndex((b) => b.id === id);
    if (index === -1) return undefined;
    const updated: Bean = { ...(items[index] as Bean), ...patch, updatedAt: Date.now() };
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
export function clearLocalBeans(): void {
  store.save([]);
}
