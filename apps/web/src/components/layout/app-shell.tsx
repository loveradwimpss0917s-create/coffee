import type { ReactNode } from 'react';
import { SidebarNav } from './sidebar-nav';
import { TabBar } from './tab-bar';

/**
 * アプリ全体の外枠。〜md は下部タブ、lg〜 はサイドバー（docs/05 §5, docs/06 §1）。
 * タイマー画面等の集中モードは別レイアウト(FocusLayout, docs/09 §3.3, 実装はブランチセグメントで対応予定)。
 */
export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-dvh">
      <SidebarNav />
      <div className="flex flex-1 flex-col">
        <main className="flex-1 pb-20 md:pb-0">{children}</main>
        <TabBar />
      </div>
    </div>
  );
}
