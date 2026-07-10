import { brewsClient } from '@/lib/api-client';
import { fetchAllPages } from '@/lib/fetch-all-pages';
import type { LogRepository } from './repository';

export const apiLogRepository: LogRepository = {
  async list() {
    return fetchAllPages(async (cursor) => {
      const res = await brewsClient.$get({ query: cursor ? { cursor } : {} });
      if (!res.ok) throw new Error('抽出ログ一覧の取得に失敗しました');
      return res.json();
    });
  },
  async get(id) {
    const res = await brewsClient[':id'].$get({ param: { id } });
    if (res.status === 404) return undefined;
    if (!res.ok) throw new Error('抽出ログの取得に失敗しました');
    return res.json();
  },
  async create(input) {
    const res = await brewsClient.$post({ json: input });
    if (!res.ok) throw new Error('抽出ログの記録に失敗しました');
    return res.json();
  },
  async update(id, patch) {
    const res = await brewsClient[':id'].$patch({ param: { id }, json: patch });
    if (res.status === 404) return undefined;
    if (!res.ok) throw new Error('抽出ログの更新に失敗しました');
    return res.json();
  },
  async remove(id) {
    const res = await brewsClient[':id'].$delete({ param: { id } });
    // $delete の成功レスポンスは204のみ宣言されており、404はnotFound()のthrowで返るためRPC型に現れない
    if (!res.ok && (res.status as number) !== 404) throw new Error('抽出ログの削除に失敗しました');
  },
};
