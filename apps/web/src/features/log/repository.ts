import type { Brew } from '@/lib/schemas';

export type CreateBrewInput = Omit<Brew, 'id'>;
export type UpdateBrewInput = Partial<
  Pick<Brew, 'rating' | 'tasteFeedback' | 'tds' | 'actualTimeSec' | 'notes'>
>;

/** ゲスト(localStorage)/ログイン(API)で共通のインターフェース(docs/09 §4)。 */
export interface LogRepository {
  list(): Promise<Brew[]>;
  get(id: string): Promise<Brew | undefined>;
  create(input: CreateBrewInput): Promise<Brew>;
  update(id: string, patch: UpdateBrewInput): Promise<Brew | undefined>;
  remove(id: string): Promise<void>;
}
