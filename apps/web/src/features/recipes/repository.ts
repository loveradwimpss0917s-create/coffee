import type { SavedRecipe } from '@/lib/schemas';

export type CreateSavedRecipeInput = Omit<SavedRecipe, 'id' | 'createdAt'>;

/** ゲスト(localStorage)/ログイン(API)で共通のインターフェース(docs/09 §4)。 */
export interface RecipesRepository {
  list(): Promise<SavedRecipe[]>;
  get(id: string): Promise<SavedRecipe | undefined>;
  create(input: CreateSavedRecipeInput): Promise<SavedRecipe>;
  remove(id: string): Promise<void>;
}
