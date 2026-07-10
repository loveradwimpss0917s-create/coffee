/**
 * カーソルページネーションAPI（docs/08 §2）を全ページ辿って配列に集約する。
 * ローカルリポジトリの list() は全件配列を返す前提のため、UI側の挙動を変えずに
 * ApiRepository でも同じ契約を保つ（docs/09 §4）。
 */
export async function fetchAllPages<T>(
  fetchPage: (cursor: string | undefined) => Promise<{ items: T[]; nextCursor: string | null }>,
): Promise<T[]> {
  const all: T[] = [];
  let cursor: string | undefined;
  for (;;) {
    const page = await fetchPage(cursor);
    all.push(...page.items);
    if (!page.nextCursor) break;
    cursor = page.nextCursor;
  }
  return all;
}
