'use client';

import { TASTE_AXIS_KEYS, type TasteProfile } from '@coffee-lab/engine';
import { Slider } from '@/components/ui/slider';
import { TASTE_AXIS_LABELS } from '@/i18n/ja';

const AXIS_COLOR_VAR: Record<(typeof TASTE_AXIS_KEYS)[number], string> = {
  acidity: 'var(--color-taste-acidity)',
  sweetness: 'var(--color-taste-sweetness)',
  bitterness: 'var(--color-taste-bitterness)',
  body: 'var(--color-taste-body)',
  clarity: 'var(--color-taste-clarity)',
};

export function TasteSliders({
  value,
  onChange,
}: {
  value: TasteProfile;
  onChange: (value: TasteProfile) => void;
}) {
  return (
    <div className="flex flex-col gap-5">
      {TASTE_AXIS_KEYS.map((axis) => (
        <div key={axis} className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-2 text-callout">
              <span
                aria-hidden="true"
                className="size-2.5 rounded-full"
                style={{ backgroundColor: AXIS_COLOR_VAR[axis] }}
              />
              {TASTE_AXIS_LABELS[axis]}
            </span>
            <span className="font-numeric text-caption text-muted-foreground">
              {value[axis] > 0 ? `+${value[axis]}` : value[axis]}
            </span>
          </div>
          <Slider
            aria-label={TASTE_AXIS_LABELS[axis]}
            min={-2}
            max={2}
            step={1}
            value={[value[axis]]}
            onValueChange={([next]) => onChange({ ...value, [axis]: next ?? 0 })}
          />
        </div>
      ))}
    </div>
  );
}
