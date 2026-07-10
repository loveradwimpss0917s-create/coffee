import { DEFAULT_SETTINGS, type UserSettings, userSettingsSchema } from '@/lib/schemas';

const KEY = 'coffee-lab:settings';

export const settingsRepository = {
  get(): UserSettings {
    if (typeof window === 'undefined') return DEFAULT_SETTINGS;
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return DEFAULT_SETTINGS;
    try {
      return userSettingsSchema.parse(JSON.parse(raw));
    } catch {
      return DEFAULT_SETTINGS;
    }
  },
  save(settings: UserSettings): void {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(KEY, JSON.stringify(settings));
  },
  update(patch: Partial<UserSettings>): UserSettings {
    const next = { ...this.get(), ...patch };
    this.save(next);
    return next;
  },
};
