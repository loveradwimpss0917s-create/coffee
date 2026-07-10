import 'server-only';

/**
 * カーソルページネーション（docs/08 §2）。カーソルは並び替えキー（作成日時等、ms epoch）をそのまま使う。
 * 一覧は sortKey の DESC を前提にする（brews/recipes/beans は全て created_at 系で降順表示のため）。
 */
export const DEFAULT_PAGE_SIZE = 20;

export function parseCursor(cursor: string | undefined): number | undefined {
  if (!cursor) return undefined;
  const value = Number(cursor);
  return Number.isFinite(value) ? value : undefined;
}

export function buildPage<T extends { sortKey: number }>(
  rows: T[],
  limit: number,
): { items: T[]; nextCursor: string | null } {
  const hasMore = rows.length > limit;
  const items = hasMore ? rows.slice(0, limit) : rows;
  const last = items.at(-1);
  return { items, nextCursor: hasMore && last ? String(last.sortKey) : null };
}
