'use client';

import { useEffect } from 'react';

type WakeLockSentinel = { release: () => Promise<void> };
type NavigatorWithWakeLock = Navigator & {
  wakeLock?: { request: (type: 'screen') => Promise<WakeLockSentinel> };
};

/** 抽出タイマー中は画面消灯を防止する（対応ブラウザのみ、docs/09 §3.3） */
export function useWakeLock(active: boolean): void {
  useEffect(() => {
    if (!active) return;
    let sentinel: WakeLockSentinel | undefined;
    const nav = navigator as NavigatorWithWakeLock;

    nav.wakeLock
      ?.request('screen')
      .then((s) => {
        sentinel = s;
      })
      .catch(() => {
        // 非対応ブラウザ・拒否は無視（進行には影響しない）
      });

    return () => {
      sentinel?.release().catch(() => undefined);
    };
  }, [active]);
}
