import { DEFAULT_SETTINGS, type UserSettings, userSettingsSchema } from '@/lib/schemas';
import type { SettingsRepository } from './repository';

const KEY = 'coffee-lab:settings';

export const localSettingsRepository: SettingsRepository = {
  async get() {
    if (typeof window === 'undefined') return DEFAULT_SETTINGS;
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return DEFAULT_SETTINGS;
    try {
      return userSettingsSchema.parse(JSON.parse(raw));
    } catch {
      return DEFAULT_SETTINGS;
    }
  },
  async save(settings: UserSettings) {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(KEY, JSON.stringify(settings));
    }
    return settings;
  },
};
