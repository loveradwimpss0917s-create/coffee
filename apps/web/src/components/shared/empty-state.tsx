import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center gap-3 px-6 py-16 text-center">
      <div className="flex size-14 items-center justify-center rounded-full bg-surface-raised">
        <Icon aria-hidden="true" size={26} strokeWidth={1.5} className="text-muted-foreground" />
      </div>
      <div className="flex flex-col gap-1">
        <p className="font-semibold text-headline">{title}</p>
        {description && <p className="text-callout text-muted-foreground">{description}</p>}
      </div>
      {action}
    </div>
  );
}
