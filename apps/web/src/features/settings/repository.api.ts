import { settingsClient } from '@/lib/api-client';
import { DEFAULT_SETTINGS } from '@/lib/schemas';
import type { SettingsRepository } from './repository';

export const apiSettingsRepository: SettingsRepository = {
  async get() {
    const res = await settingsClient.$get();
    if (!res.ok) return DEFAULT_SETTINGS;
    return res.json();
  },
  async save(settings) {
    const res = await settingsClient.$put({ json: settings });
    if (!res.ok) throw new Error('設定の保存に失敗しました');
    return res.json();
  },
};
