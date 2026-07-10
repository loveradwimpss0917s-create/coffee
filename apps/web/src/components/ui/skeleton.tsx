import type { ComponentProps } from 'react';
import { cn } from '@/lib/cn';

function Skeleton({ className, ...props }: ComponentProps<'div'>) {
  return (
    <div
      data-slot="skeleton"
      className={cn('animate-pulse rounded-sm bg-surface-raised', className)}
      {...props}
    />
  );
}

export { Skeleton };
