'use client';

import { SegmentedControl } from '@/components/shared/segmented-control';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import type { WizardInput } from '@/features/brew/use-brew-wizard';

export function WizardStepVolume({
  input,
  onChange,
}: {
  input: WizardInput;
  onChange: (patch: Partial<WizardInput>) => void;
}) {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="volume">仕上がり量</Label>
          <span className="font-numeric text-callout">{input.targetVolumeMl}ml</span>
        </div>
        <Slider
          id="volume"
          min={30}
          max={1000}
          step={10}
          value={[input.targetVolumeMl]}
          onValueChange={([v]) => onChange({ targetVolumeMl: v ?? input.targetVolumeMl })}
        />
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="strength">濃度の好み</Label>
          <span className="font-numeric text-callout">
            {input.strength > 0 ? `+${input.strength}` : input.strength}
          </span>
        </div>
        <Slider
          id="strength"
          min={-2}
          max={2}
          step={1}
          value={[input.strength]}
          onValueChange={([v]) => onChange({ strength: v ?? input.strength })}
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label>Hot / Iced</Label>
        <SegmentedControl
          value={input.serveStyle}
          onChange={(v) => onChange({ serveStyle: v })}
          options={[
            { value: 'hot', label: 'Hot' },
            { value: 'iced', label: 'Iced' },
          ]}
        />
      </div>
    </div>
  );
}
