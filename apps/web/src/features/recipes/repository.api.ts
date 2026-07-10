import { recipesClient } from '@/lib/api-client';
import { fetchAllPages } from '@/lib/fetch-all-pages';
import type { RecipesRepository } from './repository';

export const apiRecipesRepository: RecipesRepository = {
  async list() {
    return fetchAllPages(async (cursor) => {
      const res = await recipesClient.$get({ query: cursor ? { cursor } : {} });
      if (!res.ok) throw new Error('保存レシピ一覧の取得に失敗しました');
      return res.json();
    });
  },
  async get(id) {
    const res = await recipesClient[':id'].$get({ param: { id } });
    if (res.status === 404) return undefined;
    if (!res.ok) throw new Error('保存レシピの取得に失敗しました');
    return res.json();
  },
  async create(input) {
    const res = await recipesClient.$post({ json: input });
    if (!res.ok) throw new Error('保存レシピの作成に失敗しました');
    return res.json();
  },
  async remove(id) {
    const res = await recipesClient[':id'].$delete({ param: { id } });
    // $delete の成功レスポンスは204のみ宣言されており、404はnotFound()のthrowで返るためRPC型に現れない
    if (!res.ok && (res.status as number) !== 404)
      throw new Error('保存レシピの削除に失敗しました');
  },
};
