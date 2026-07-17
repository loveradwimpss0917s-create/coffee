'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useBrewWizardStore } from '@/features/brew/use-brew-wizard';
import { cn } from '@/lib/cn';
import { NAV_ITEMS } from './nav-items';

function isActive(pathname: string, href: string): boolean {
  if (href === '/') return pathname === '/';
  return pathname === href || pathname.startsWith(`${href}/`);
}

/**
 * モバイル(〜md)向け下部タブバー（docs/05 §5, docs/06 §1）。
 * セーフエリア(env(safe-area-inset-bottom))対応、タップターゲット44px以上。
 */
export function TabBar() {
  const pathname = usePathname();
  const resetWizard = useBrewWizardStore((s) => s.reset);

  return (
    <nav
      aria-label="メインナビゲーション"
      className="fixed inset-x-0 bottom-0 z-40 border-border border-t bg-surface/95 backdrop-blur md:hidden"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <ul className="flex items-stretch justify-around">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active = isActive(pathname, href);
          return (
            <li key={href} className="flex-1">
              <Link
                href={href}
                aria-current={active ? 'page' : undefined}
                onClick={() => {
                  if (href === '/brew') resetWizard();
                }}
                className={cn(
                  'flex min-h-11 flex-col items-center justify-center gap-0.5 py-2 text-micro transition-colors duration-(--duration-fast)',
                  active ? 'text-primary' : 'text-muted-foreground',
                )}
              >
                <Icon aria-hidden="true" size={22} strokeWidth={1.5} />
                <span>{label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
