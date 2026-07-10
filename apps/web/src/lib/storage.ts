import { z } from 'zod';

/**
 * バージョン付き localStorage envelope（docs/07 §5, docs/09 §4）。
 * ゲストのローカルデータはこの形式で保存し、将来のスキーマ変更に migrate() で対応する。
 */
function envelopeSchema<T extends z.ZodTypeAny>(itemSchema: T) {
  return z.object({
    version: z.number().int(),
    items: z.array(itemSchema),
  });
}

export type StorageStore<T> = {
  list: () => T[];
  save: (items: T[]) => void;
};

export function createLocalStore<T>(
  key: string,
  itemSchema: z.ZodType<T>,
  currentVersion = 1,
): StorageStore<T> {
  const schema = envelopeSchema(itemSchema);

  return {
    list(): T[] {
      if (typeof window === 'undefined') return [];
      const raw = window.localStorage.getItem(key);
      if (!raw) return [];
      try {
        const parsed = schema.parse(JSON.parse(raw));
        if (parsed.version !== currentVersion) return [];
        return parsed.items;
      } catch {
        return [];
      }
    },
    save(items: T[]): void {
      if (typeof window === 'undefined') return;
      window.localStorage.setItem(key, JSON.stringify({ version: currentVersion, items }));
    },
  };
}
