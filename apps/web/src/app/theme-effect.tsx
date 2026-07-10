'use client';

import { useEffect } from 'react';
import { useSettings } from '@/features/settings/queries';

/** 設定のテーマ選択を <html data-theme> に反映する（docs/05 §2.1） */
export function ThemeEffect() {
  const { data: settings } = useSettings();

  useEffect(() => {
    const theme = settings?.theme ?? 'system';
    if (theme === 'system') {
      document.documentElement.removeAttribute('data-theme');
    } else {
      document.documentElement.dataset.theme = theme;
    }
  }, [settings?.theme]);

  return null;
}
