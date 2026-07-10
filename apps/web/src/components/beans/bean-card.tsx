import Link from 'next/link';
import { PROCESS_LABELS, ROAST_LEVEL_LABELS } from '@/i18n/ja';
import type { Bean } from '@/lib/schemas';

export function BeanCard({ bean }: { bean: Bean }) {
  return (
    <Link
      href={`/beans/${bean.id}`}
      className="flex flex-col gap-1 rounded-md border border-border bg-surface px-4 py-3 transition-colors duration-(--duration-fast) hover:bg-surface-raised"
    >
      <span className="font-semibold text-callout">{bean.name}</span>
      <span className="text-caption text-muted-foreground">
        {[bean.roaster, ROAST_LEVEL_LABELS[bean.roastLevel], PROCESS_LABELS[bean.process]]
          .filter(Boolean)
          .join(' · ')}
      </span>
    </Link>
  );
}
