import type { LucideIcon } from 'lucide-react';
import { Coffee, House, NotebookText, Settings, Wheat } from 'lucide-react';

export type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
};

/** 下部タブ / サイドバー共通のナビゲーション項目（docs/06 §1） */
export const NAV_ITEMS: readonly NavItem[] = [
  { href: '/', label: 'ホーム', icon: House },
  { href: '/brew', label: '淹れる', icon: Coffee },
  { href: '/log', label: 'ログ', icon: NotebookText },
  { href: '/beans', label: '豆', icon: Wheat },
  { href: '/settings', label: '設定', icon: Settings },
];
