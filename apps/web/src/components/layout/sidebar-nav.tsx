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

/** デスクトップ(lg〜)向けサイドバーナビ（docs/05 §5） */
export function SidebarNav() {
  const pathname = usePathname();
  const resetWizard = useBrewWizardStore((s) => s.reset);

  return (
    <nav
      aria-label="メインナビゲーション"
      className="sticky top-0 hidden h-dvh w-56 shrink-0 flex-col gap-1 border-border border-r bg-surface p-4 lg:flex"
    >
      <p className="mb-4 px-2 font-semibold text-headline">Coffee Recipe Lab</p>
      <ul className="flex flex-col gap-1">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active = isActive(pathname, href);
          return (
            <li key={href}>
              <Link
                href={href}
                aria-current={active ? 'page' : undefined}
                onClick={() => {
                  if (href === '/brew') resetWizard();
                }}
                className={cn(
                  'flex min-h-11 items-center gap-3 rounded-md px-3 text-callout transition-colors duration-(--duration-fast)',
                  active
                    ? 'bg-surface-raised text-primary'
                    : 'text-muted-foreground hover:bg-surface-raised hover:text-foreground',
                )}
              >
                <Icon aria-hidden="true" size={20} strokeWidth={1.5} />
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
