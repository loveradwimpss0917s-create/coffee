import { createId } from '@/lib/id';
import { type SavedRecipe, savedRecipeSchema } from '@/lib/schemas';
import { createLocalStore } from '@/lib/storage';
import type { RecipesRepository } from './repository';

const store = createLocalStore<SavedRecipe>('coffee-lab:recipes', savedRecipeSchema, 1);

export const localRecipesRepository: RecipesRepository = {
  async list() {
    return store.list().sort((a, b) => b.createdAt - a.createdAt);
  },
  async get(id) {
    return store.list().find((r) => r.id === id);
  },
  async create(input) {
    const recipe: SavedRecipe = { ...input, id: createId('rcp'), createdAt: Date.now() };
    store.save([...store.list(), recipe]);
    return recipe;
  },
  async remove(id) {
    store.save(store.list().filter((r) => r.id !== id));
  },
};

/** アカウント同期後にゲストデータを消去する(features/auth/sync.ts から使用)。 */
export function clearLocalRecipes(): void {
  store.save([]);
}
