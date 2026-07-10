import { beansClient } from '@/lib/api-client';
import { fetchAllPages } from '@/lib/fetch-all-pages';
import type { BeansRepository } from './repository';

export const apiBeansRepository: BeansRepository = {
  async list() {
    return fetchAllPages(async (cursor) => {
      const res = await beansClient.$get({ query: cursor ? { cursor } : {} });
      if (!res.ok) throw new Error('豆一覧の取得に失敗しました');
      return res.json();
    });
  },
  async get(id) {
    const res = await beansClient[':id'].$get({ param: { id } });
    if (res.status === 404) return undefined;
    if (!res.ok) throw new Error('豆の取得に失敗しました');
    return res.json();
  },
  async create(input) {
    const res = await beansClient.$post({ json: input });
    if (!res.ok) throw new Error('豆の作成に失敗しました');
    return res.json();
  },
  async update(id, patch) {
    const res = await beansClient[':id'].$patch({ param: { id }, json: patch });
    if (res.status === 404) return undefined;
    if (!res.ok) throw new Error('豆の更新に失敗しました');
    return res.json();
  },
  async remove(id) {
    const res = await beansClient[':id'].$delete({ param: { id } });
    // $delete の成功レスポンスは204のみ宣言されており、404はnotFound()のthrowで返るためRPC型に現れない
    if (!res.ok && (res.status as number) !== 404) throw new Error('豆の削除に失敗しました');
  },
};
