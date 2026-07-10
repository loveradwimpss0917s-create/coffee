'use client';

import { useId } from 'react';
import { cn } from '@/lib/cn';

export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
}) {
  const name = useId();

  return (
    <div
      role="radiogroup"
      className="inline-flex items-center gap-0.5 rounded-full border border-border bg-surface p-1"
    >
      {options.map((option) => {
        const inputId = `${name}-${option.value}`;
        const checked = value === option.value;
        return (
          <label
            key={option.value}
            htmlFor={inputId}
            className={cn(
              'min-h-9 cursor-pointer rounded-full px-4 py-1.5 text-callout leading-6 transition-colors duration-(--duration-fast)',
              checked
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            <input
              type="radio"
              id={inputId}
              name={name}
              value={option.value}
              checked={checked}
              onChange={() => onChange(option.value)}
              className="sr-only"
            />
            {option.label}
          </label>
        );
      })}
    </div>
  );
}
