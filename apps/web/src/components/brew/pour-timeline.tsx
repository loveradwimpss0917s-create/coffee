import type { Recipe, RecipeStep } from '@coffee-lab/engine';
import type { LucideIcon } from 'lucide-react';
import { Droplet, Flame, Lock, Timer, Unlock, Waves } from 'lucide-react';
import { formatTime } from './format-time';

export { formatTime } from './format-time';

export type TimelineRow = { icon: LucideIcon; label: string; detail: string; atSec: number };

export function buildTimelineRows(steps: RecipeStep[]): TimelineRow[] {
  let pourCount = 0;
  return steps.map((step): TimelineRow => {
    switch (step.kind) {
      case 'bloom':
        return {
          icon: Droplet,
          label: '蒸らし',
          detail: `${step.waterG}g（${step.durationSec}秒）`,
          atSec: step.atSec,
        };
      case 'pour':
        pourCount += 1;
        return {
          icon: Droplet,
          label: `${pourCount}投目`,
          detail: `→ ${step.toWaterG}g`,
          atSec: step.atSec,
        };
      case 'wait':
        return {
          icon: Timer,
          label: '浸漬',
          detail: `${formatTime(step.untilSec)} まで`,
          atSec: step.atSec,
        };
      case 'stir':
        return {
          icon: Waves,
          label: step.method === 'swirl' ? '揺すって攪拌' : 'スプーンで攪拌',
          detail: '',
          atSec: step.atSec,
        };
      case 'valve':
        return {
          icon: step.state === 'open' ? Unlock : Lock,
          label: step.state === 'open' ? '弁を開く' : '弁を閉じる',
          detail: '',
          atSec: step.atSec,
        };
      case 'press':
        return {
          icon: Waves,
          label: 'プレス',
          detail: `${step.durationSec}秒かけて`,
          atSec: step.atSec,
        };
      case 'temperatureChange':
        return {
          icon: Flame,
          label: '湯温を変更',
          detail: `${step.toTempC}°C の湯に切り替え`,
          atSec: step.atSec,
        };
      case 'drawdown':
        return {
          icon: Timer,
          label: '落としきり',
          detail: `${formatTime(step.expectedEndSec)} 頃まで`,
          atSec: step.atSec,
        };
      default:
        return step satisfies never;
    }
  });
}

export function PourTimeline({ recipe }: { recipe: Recipe }) {
  const rows = buildTimelineRows(recipe.steps);

  return (
    <ol className="flex flex-col">
      {rows.map((row, i) => {
        const Icon = row.icon;
        return (
          <li key={i} className="relative flex gap-3 pb-5 pl-1 last:pb-0">
            {i < rows.length - 1 && (
              <span
                aria-hidden="true"
                className="absolute top-7 left-[15px] h-full w-px bg-border"
              />
            )}
            <span className="z-10 flex size-8 shrink-0 items-center justify-center rounded-full bg-surface-raised">
              <Icon size={15} strokeWidth={1.5} aria-hidden="true" />
            </span>
            <div className="flex flex-1 items-baseline justify-between gap-2 pt-1">
              <div className="flex flex-col">
                <span className="font-medium text-callout">{row.label}</span>
                {row.detail && (
                  <span className="font-numeric text-caption text-muted-foreground">
                    {row.detail}
                  </span>
                )}
              </div>
              <span className="font-numeric text-caption text-muted-foreground">
                {formatTime(row.atSec)}
              </span>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
