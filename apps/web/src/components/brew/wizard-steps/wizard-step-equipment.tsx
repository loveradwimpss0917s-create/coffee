'use client';

import { DRIPPERS, GRINDERS } from '@coffee-lab/engine';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { WizardInput } from '@/features/brew/use-brew-wizard';
import { useSettings } from '@/features/settings/queries';
import { cn } from '@/lib/cn';

export function WizardStepEquipment({
  input,
  onChange,
}: {
  input: WizardInput;
  onChange: (patch: Partial<WizardInput>) => void;
}) {
  const { data: settings } = useSettings();
  const ownedIds = settings?.ownedDripperIds ?? [];
  const orderedDrippers = [...DRIPPERS].sort((a, b) => {
    const aOwned = ownedIds.includes(a.id) ? 0 : 1;
    const bOwned = ownedIds.includes(b.id) ? 0 : 1;
    return aOwned - bOwned;
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <Label>ドリッパー</Label>
        <div className="flex flex-col gap-2">
          {orderedDrippers.map((dripper) => {
            const selected = input.equipment.dripperId === dripper.id;
            return (
              <button
                key={dripper.id}
                type="button"
                onClick={() =>
                  onChange({ equipment: { ...input.equipment, dripperId: dripper.id } })
                }
                className={cn(
                  'rounded-md border px-4 py-3 text-left transition-colors duration-(--duration-fast)',
                  selected ? 'border-primary bg-surface-raised' : 'border-border bg-surface',
                )}
              >
                <p className="font-medium text-callout">{dripper.name}</p>
                {dripper.notes && (
                  <p className="text-caption text-muted-foreground">{dripper.notes}</p>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="grinder">グラインダー</Label>
        <Select
          value={input.equipment.grinderId ?? settings?.defaultGrinderId ?? 'none'}
          onValueChange={(v) =>
            onChange({
              equipment: { ...input.equipment, grinderId: v === 'none' ? undefined : v },
            })
          }
        >
          <SelectTrigger id="grinder">
            <SelectValue placeholder="選択してください" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">未設定（一般表記のみ）</SelectItem>
            {GRINDERS.map((grinder) => (
              <SelectItem key={grinder.id} value={grinder.id}>
                {grinder.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
