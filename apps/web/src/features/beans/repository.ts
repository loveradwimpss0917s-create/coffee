import { createId } from '@/lib/id';
import { type Bean, beanSchema } from '@/lib/schemas';
import { createLocalStore } from '@/lib/storage';

const store = createLocalStore<Bean>('coffee-lab:beans', beanSchema, 1);

export type CreateBeanInput = Omit<Bean, 'id' | 'createdAt' | 'updatedAt'>;
export type UpdateBeanInput = Partial<CreateBeanInput>;

export const beansRepository = {
  list(): Bean[] {
    return store.list().sort((a, b) => b.createdAt - a.createdAt);
  },
  get(id: string): Bean | undefined {
    return store.list().find((b) => b.id === id);
  },
  create(input: CreateBeanInput): Bean {
    const now = Date.now();
    const bean: Bean = { ...input, id: createId('ben'), createdAt: now, updatedAt: now };
    store.save([...store.list(), bean]);
    return bean;
  },
  update(id: string, patch: UpdateBeanInput): Bean | undefined {
    const items = store.list();
    const index = items.findIndex((b) => b.id === id);
    if (index === -1) return undefined;
    const current = items[index] as Bean;
    const updated: Bean = { ...current, ...patch, updatedAt: Date.now() };
    const next = [...items];
    next[index] = updated;
    store.save(next);
    return updated;
  },
  remove(id: string): void {
    store.save(store.list().filter((b) => b.id !== id));
  },
};
