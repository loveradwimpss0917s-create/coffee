'use client';

import { TASTE_PRESETS } from '@coffee-lab/engine';
import { TasteRadar } from '@/components/brew/taste-radar';
import { TasteSliders } from '@/components/brew/taste-sliders';
import type { WizardInput } from '@/features/brew/use-brew-wizard';
import { TASTE_PRESET_LABELS } from '@/i18n/ja';
import { cn } from '@/lib/cn';

export function WizardStepTaste({
  input,
  onChange,
}: {
  input: WizardInput;
  onChange: (patch: Partial<WizardInput>) => void;
}) {
  return (
    <div className="flex flex-col gap-6">
      <TasteRadar profile={input.taste} />
      <TasteSliders value={input.taste} onChange={(taste) => onChange({ taste })} />

      <div className="flex flex-col gap-2">
        <p className="text-callout text-muted-foreground">プリセット</p>
        <div className="flex flex-wrap gap-2">
          {Object.entries(TASTE_PRESETS).map(([key, preset]) => (
            <button
              key={key}
              type="button"
              onClick={() => onChange({ taste: preset })}
              className={cn(
                'min-h-9 rounded-full border px-3 text-callout transition-colors duration-(--duration-fast)',
                JSON.stringify(input.taste) === JSON.stringify(preset)
                  ? 'border-primary bg-surface-raised text-primary'
                  : 'border-border bg-surface text-muted-foreground',
              )}
            >
              {TASTE_PRESET_LABELS[key] ?? key}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
