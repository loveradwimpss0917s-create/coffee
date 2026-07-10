import type { UserSettings } from '@/lib/schemas';

/** ゲスト(localStorage)/ログイン(API)で共通のインターフェース(docs/09 §4)。 */
export interface SettingsRepository {
  get(): Promise<UserSettings>;
  save(settings: UserSettings): Promise<UserSettings>;
}
