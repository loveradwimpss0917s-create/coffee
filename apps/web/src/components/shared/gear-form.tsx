'use client';

import { DRIPPERS, GRINDERS } from '@coffee-lab/engine';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { UserSettings } from '@/lib/schemas';

export function GearForm({
  value,
  onChange,
}: {
  value: Pick<UserSettings, 'ownedDripperIds' | 'defaultGrinderId' | 'grinderCalibrationOffset'>;
  onChange: (
    patch: Partial<
      Pick<UserSettings, 'ownedDripperIds' | 'defaultGrinderId' | 'grinderCalibrationOffset'>
    >,
  ) => void;
}) {
  function toggleDripper(id: string, checked: boolean) {
    const next = checked
      ? [...value.ownedDripperIds, id]
      : value.ownedDripperIds.filter((d) => d !== id);
    onChange({ ownedDripperIds: next });
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <Label>お持ちのドリッパー（複数選択可）</Label>
        <div className="grid grid-cols-2 gap-2">
          {DRIPPERS.map((dripper) => {
            const checked = value.ownedDripperIds.includes(dripper.id);
            const inputId = `dripper-${dripper.id}`;
            return (
              <label
                key={dripper.id}
                htmlFor={inputId}
                className="flex min-h-11 items-center gap-2 rounded-sm border border-border bg-surface px-3 py-2"
              >
                <Checkbox
                  id={inputId}
                  checked={checked}
                  onCheckedChange={(next) => toggleDripper(dripper.id, next === true)}
                />
                <span className="text-callout">{dripper.name}</span>
              </label>
            );
          })}
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="grinder">グラインダー</Label>
        <Select
          value={value.defaultGrinderId ?? 'none'}
          onValueChange={(next) =>
            onChange({ defaultGrinderId: next === 'none' ? undefined : next })
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

      {value.defaultGrinderId && (
        <div className="flex flex-col gap-2">
          <Label htmlFor="calibration">キャリブレーション補正値</Label>
          <Input
            id="calibration"
            type="number"
            inputMode="decimal"
            value={value.grinderCalibrationOffset}
            onChange={(e) => onChange({ grinderCalibrationOffset: Number(e.target.value) || 0 })}
          />
          <p className="text-caption text-muted-foreground">
            アプリの基準粒度と実際の目盛がずれている場合に補正します（未実測なら0のままでOK）。
          </p>
        </div>
      )}
    </div>
  );
}
