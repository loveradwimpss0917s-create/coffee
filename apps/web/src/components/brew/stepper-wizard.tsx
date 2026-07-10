import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

export function StepperWizard({
  stepIndex,
  stepCount,
  title,
  children,
}: {
  stepIndex: number;
  stepCount: number;
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="mx-auto flex max-w-md flex-col gap-6 px-5 py-6">
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-1.5" aria-hidden="true">
          {Array.from({ length: stepCount }).map((_, i) => (
            <span
              key={i}
              className={cn(
                'h-1.5 flex-1 rounded-full transition-colors duration-(--duration-base)',
                i <= stepIndex ? 'bg-primary' : 'bg-border',
              )}
            />
          ))}
        </div>
        <div className="flex items-center justify-between">
          <h1 className="font-semibold text-title2">{title}</h1>
          <span className="font-numeric text-caption text-muted-foreground">
            {stepIndex + 1}/{stepCount}
          </span>
        </div>
      </div>
      {children}
    </div>
  );
}
