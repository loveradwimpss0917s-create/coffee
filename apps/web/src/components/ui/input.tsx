import type { ComponentProps } from 'react';
import { cn } from '@/lib/cn';

function Input({ className, type, ...props }: ComponentProps<'input'>) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        'flex h-11 w-full min-w-0 rounded-sm border border-border bg-surface px-3 py-2 text-body text-foreground outline-none placeholder:text-muted-foreground',
        'transition-colors duration-(--duration-fast) focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/40',
        'disabled:cursor-not-allowed disabled:opacity-50',
        className,
      )}
      {...props}
    />
  );
}

export { Input };
