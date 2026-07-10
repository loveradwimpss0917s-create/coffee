import type { Bean } from '@/lib/schemas';

export type CreateBeanInput = Omit<Bean, 'id' | 'createdAt' | 'updatedAt'>;
export type UpdateBeanInput = Partial<CreateBeanInput>;

/** ゲスト(localStorage)/ログイン(API)で共通のインターフェース(docs/09 §4)。 */
export interface BeansRepository {
  list(): Promise<Bean[]>;
  get(id: string): Promise<Bean | undefined>;
  create(input: CreateBeanInput): Promise<Bean>;
  update(id: string, patch: UpdateBeanInput): Promise<Bean | undefined>;
  remove(id: string): Promise<void>;
}
