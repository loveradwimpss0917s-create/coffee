'use client';

import { Lock, Pause, Play, Unlock, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { BrewTimerRing } from '@/components/brew/brew-timer-ring';
import { buildTimelineRows, formatTime } from '@/components/brew/pour-timeline';
import { Button } from '@/components/ui/button';
import { getElapsedSec, useBrewTimerStore } from '@/features/brew/use-brew-timer';
import { useNow } from '@/features/brew/use-now';
import { useWakeLock } from '@/features/brew/use-wake-lock';
import { cn } from '@/lib/cn';

export default function BrewTimerPage() {
  const router = useRouter();
  const state = useBrewTimerStore();
  const { recipe, currentStepIndex, status, completeStep, pause, resume, abort } = state;
  const now = useNow();

  useWakeLock(status === 'running');

  useEffect(() => {
    if (!recipe) router.replace('/brew/result');
  }, [recipe, router]);

  useEffect(() => {
    if (status === 'done') router.push('/brew/feedback');
  }, [status, router]);

  if (!recipe) return null;

  const elapsedSec = getElapsedSec(state, now);
  const rows = buildTimelineRows(recipe.steps);
  const currentRow = rows[currentStepIndex];
  const nextRow = rows[currentStepIndex + 1];

  const latestValveStep = recipe.steps
    .slice(0, currentStepIndex + 1)
    .filter((s) => s.kind === 'valve')
    .at(-1);

  function handleAbort() {
    abort();
    router.push('/brew/result');
  }

  return (
    <div className="mx-auto flex max-w-md flex-col gap-6 px-5 py-6">
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="icon" aria-label="中断" onClick={handleAbort}>
          <X size={20} aria-hidden="true" />
        </Button>
        <span className="font-numeric text-callout text-muted-foreground">
          {formatTime(elapsedSec)} / {formatTime(recipe.totalTimeSec)}
        </span>
        <Button
          variant="ghost"
          size="icon"
          aria-label={status === 'paused' ? '再開' : '一時停止'}
          onClick={status === 'paused' ? resume : pause}
        >
          {status === 'paused' ? (
            <Play size={20} aria-hidden="true" />
          ) : (
            <Pause size={20} aria-hidden="true" />
          )}
        </Button>
      </div>

      <BrewTimerRing
        elapsedSec={elapsedSec}
        totalSec={recipe.totalTimeSec}
        primaryLabel={currentRow?.label ?? '完了'}
        secondaryLabel={currentRow?.detail ?? 'お疲れさまでした'}
      />

      {nextRow && (
        <p className="text-center text-callout text-muted-foreground">
          次: {formatTime(nextRow.atSec)} に {nextRow.label}
        </p>
      )}

      <div className="flex items-center gap-1.5" aria-hidden="true">
        {rows.map((row, i) => (
          <span
            key={`${row.label}-${row.atSec}`}
            className={cn(
              'h-1.5 flex-1 rounded-full transition-colors duration-(--duration-base)',
              i < currentStepIndex
                ? 'bg-primary'
                : i === currentStepIndex
                  ? 'bg-primary/60'
                  : 'bg-border',
            )}
          />
        ))}
      </div>

      <Button size="lg" className="w-full" onClick={completeStep} disabled={status === 'paused'}>
        {currentStepIndex >= rows.length - 1 ? '抽出を完了する' : '注ぎ終えた（次へ）'}
      </Button>

      {latestValveStep?.kind === 'valve' && recipe.dripperId === 'hario-switch' && (
        <div className="flex items-center justify-center gap-2 text-callout text-muted-foreground">
          {latestValveStep.state === 'open' ? (
            <Unlock size={16} aria-hidden="true" />
          ) : (
            <Lock size={16} aria-hidden="true" />
          )}
          Switch: 現在{latestValveStep.state === 'open' ? '開放' : '閉鎖'}中
        </div>
      )}
    </div>
  );
}
