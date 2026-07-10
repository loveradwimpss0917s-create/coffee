'use client';

import { Star } from 'lucide-react';
import { useId } from 'react';
import { cn } from '@/lib/cn';

const STAR_VALUES = [1, 2, 3, 4, 5];

export function RatingStars({
  value,
  onChange,
  readOnly = false,
}: {
  value: number;
  onChange?: (value: number) => void;
  readOnly?: boolean;
}) {
  const name = useId();

  if (readOnly) {
    return (
      <div className="flex items-center gap-1" role="img" aria-label={`評価 ${value} / 5`}>
        {STAR_VALUES.map((star) => (
          <Star
            key={star}
            aria-hidden="true"
            size={28}
            strokeWidth={1.5}
            className={value >= star ? 'fill-primary text-primary' : 'text-border'}
          />
        ))}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1" role="radiogroup" aria-label="評価">
      {STAR_VALUES.map((star) => {
        const inputId = `${name}-${star}`;
        return (
          <label
            key={star}
            htmlFor={inputId}
            className={cn('flex size-11 cursor-pointer items-center justify-center')}
          >
            <input
              type="radio"
              id={inputId}
              name={name}
              value={star}
              checked={value === star}
              onChange={() => onChange?.(star)}
              className="sr-only"
              aria-label={`${star}つ星`}
            />
            <Star
              aria-hidden="true"
              size={28}
              strokeWidth={1.5}
              className={value >= star ? 'fill-primary text-primary' : 'text-border'}
            />
          </label>
        );
      })}
    </div>
  );
}
