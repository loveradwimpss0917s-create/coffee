import { createId } from '@/lib/id';
import { type SavedRecipe, savedRecipeSchema } from '@/lib/schemas';
import { createLocalStore } from '@/lib/storage';

const store = createLocalStore<SavedRecipe>('coffee-lab:recipes', savedRecipeSchema, 1);

export type CreateSavedRecipeInput = Omit<SavedRecipe, 'id' | 'createdAt'>;

export const recipesRepository = {
  list(): SavedRecipe[] {
    return store.list().sort((a, b) => b.createdAt - a.createdAt);
  },
  get(id: string): SavedRecipe | undefined {
    return store.list().find((r) => r.id === id);
  },
  create(input: CreateSavedRecipeInput): SavedRecipe {
    const recipe: SavedRecipe = { ...input, id: createId('rcp'), createdAt: Date.now() };
    store.save([...store.list(), recipe]);
    return recipe;
  },
  remove(id: string): void {
    store.save(store.list().filter((r) => r.id !== id));
  },
};
