'use client';

import { processSchema, roastLevelSchema } from '@coffee-lab/engine';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useBeans } from '@/features/beans/queries';
import type { WizardInput } from '@/features/brew/use-brew-wizard';
import { PROCESS_LABELS, ROAST_LEVEL_LABELS } from '@/i18n/ja';
import { cn } from '@/lib/cn';

export function WizardStepBean({
  input,
  onChange,
}: {
  input: WizardInput;
  onChange: (patch: Partial<WizardInput>) => void;
}) {
  const { data: beans } = useBeans();

  return (
    <div className="flex flex-col gap-6">
      {beans && beans.length > 0 && (
        <div className="flex flex-col gap-2">
          <Label>登録済みの豆から選ぶ</Label>
          <div className="flex flex-col gap-2">
            {beans.map((bean) => {
              const selected = input.beanId === bean.id;
              return (
                <button
                  key={bean.id}
                  type="button"
                  onClick={() =>
                    onChange({
                      beanId: bean.id,
                      bean: { roastLevel: bean.roastLevel, process: bean.process },
                    })
                  }
                  className={cn(
                    'rounded-md border px-4 py-3 text-left transition-colors duration-(--duration-fast)',
                    selected ? 'border-primary bg-surface-raised' : 'border-border bg-surface',
                  )}
                >
                  <p className="font-medium text-callout">{bean.name}</p>
                  <p className="text-caption text-muted-foreground">
                    {ROAST_LEVEL_LABELS[bean.roastLevel]} · {PROCESS_LABELS[bean.process]}
                  </p>
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div className="flex flex-col gap-2">
        <Label htmlFor="roastLevel">焙煎度</Label>
        <Select
          value={input.bean.roastLevel}
          onValueChange={(v) =>
            onChange({
              beanId: undefined,
              bean: { ...input.bean, roastLevel: roastLevelSchema.parse(v) },
            })
          }
        >
          <SelectTrigger id="roastLevel">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(ROAST_LEVEL_LABELS).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="process">精製方法</Label>
        <Select
          value={input.bean.process}
          onValueChange={(v) =>
            onChange({
              beanId: undefined,
              bean: { ...input.bean, process: processSchema.parse(v) },
            })
          }
        >
          <SelectTrigger id="process">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(PROCESS_LABELS).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
