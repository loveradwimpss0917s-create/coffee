import { createId } from '@/lib/id';
import { type Brew, brewSchema } from '@/lib/schemas';
import { createLocalStore } from '@/lib/storage';

const store = createLocalStore<Brew>('coffee-lab:brews', brewSchema, 1);

export type CreateBrewInput = Omit<Brew, 'id'>;
export type UpdateBrewInput = Partial<Omit<Brew, 'id' | 'input' | 'output' | 'brewedAt'>>;

export const logRepository = {
  list(): Brew[] {
    return store.list().sort((a, b) => b.brewedAt - a.brewedAt);
  },
  get(id: string): Brew | undefined {
    return store.list().find((b) => b.id === id);
  },
  create(input: CreateBrewInput): Brew {
    const brew: Brew = { ...input, id: createId('brw') };
    store.save([...store.list(), brew]);
    return brew;
  },
  update(id: string, patch: UpdateBrewInput): Brew | undefined {
    const items = store.list();
    const index = items.findIndex((b) => b.id === id);
    if (index === -1) return undefined;
    const updated: Brew = { ...(items[index] as Brew), ...patch };
    const next = [...items];
    next[index] = updated;
    store.save(next);
    return updated;
  },
  remove(id: string): void {
    store.save(store.list().filter((b) => b.id !== id));
  },
};
