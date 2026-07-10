import { nanoid } from 'nanoid';
import { clearLocalBeans, localBeansRepository } from '@/features/beans/repository.local';
import { clearLocalBrews, localLogRepository } from '@/features/log/repository.local';
import { clearLocalRecipes, localRecipesRepository } from '@/features/recipes/repository.local';
import { syncClient } from '@/lib/api-client';

export type GuestSyncResult = {
  imported: { beans: number; recipes: number; brews: number };
  skipped: boolean;
};

/**
 * サインイン/サインアップ成功直後に呼ぶ。ゲストのlocalStorageデータを
 * POST /sync/import で一括取込し、取り込み済みのローカルデータは消去する
 * (docs/07 §5, docs/08 §3)。呼び出し元(2-4の認証画面)は結果を通知に使ってよい。
 */
export async function syncGuestDataToAccount(): Promise<GuestSyncResult | null> {
  const [beans, recipes, brews] = await Promise.all([
    localBeansRepository.list(),
    localRecipesRepository.list(),
    localLogRepository.list(),
  ]);

  if (beans.length === 0 && recipes.length === 0 && brews.length === 0) {
    return null;
  }

  const res = await syncClient.import.$post({
    json: { importId: `imp_${nanoid()}`, beans, recipes, brews },
  });
  if (!res.ok) throw new Error('ゲストデータの同期に失敗しました');
  const result = (await res.json()) as GuestSyncResult;

  clearLocalBeans();
  clearLocalRecipes();
  clearLocalBrews();

  return result;
}
