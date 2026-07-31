'use client';

import { DRIPPERS } from '@coffee-lab/engine';
import { useEffect } from 'react';
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
  const dripper = DRIPPERS.find((d) => d.id === input.equipment.dripperId);
  const [minMl, maxMl] = dripper?.volumeRangeMl ?? [30, 1000];

  // 器具を切り替えて対応レンジ外になった場合は、範囲内へ寄せる
  // biome-ignore lint/correctness/useExhaustiveDependencies: input.targetVolumeMl/onChange を含めると無限ループになるため意図的に除外
  useEffect(() => {
    if (input.targetVolumeMl < minMl) onChange({ targetVolumeMl: minMl });
    else if (input.targetVolumeMl > maxMl) onChange({ targetVolumeMl: maxMl });
  }, [minMl, maxMl]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="volume">仕上がり量</Label>
          <span className="font-numeric text-callout">{input.targetVolumeMl}ml</span>
        </div>
        <Slider
          id="volume"
          min={minMl}
          max={maxMl}
          step={10}
          value={[input.targetVolumeMl]}
          onValueChange={([v]) => onChange({ targetVolumeMl: v ?? input.targetVolumeMl })}
        />
        {dripper?.volumeRangeMl && (
          <p className="text-caption text-muted-foreground">
            {dripper.name}は{minMl}〜{maxMl}ml向けの器具です。
          </p>
        )}
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
