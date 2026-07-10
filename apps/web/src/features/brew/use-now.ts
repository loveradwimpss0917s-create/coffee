'use client';

import { useEffect, useState } from 'react';

/**
 * 現在時刻を一定間隔で更新するフック。タイマー表示専用コンポーネントのみが購読し、
 * アプリ全体の再レンダーを避ける（docs/09 §2.2）。
 */
export function useNow(intervalMs = 200): number {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), intervalMs);
    return () => window.clearInterval(id);
  }, [intervalMs]);

  return now;
}
