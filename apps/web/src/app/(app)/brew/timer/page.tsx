'use client';

import { Lock, Pause, Play, Unlock, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { BrewTimerRing } from '@/components/brew/brew-timer-ring';
import { buildTimelineRows, formatTime, PourTimeline } from '@/components/brew/pour-timeline';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { getElapsedSec, useBrewTimerStore } from '@/features/brew/use-brew-timer';
import { useNow } from '@/features/brew/use-now';
import { useWakeLock } from '@/features/brew/use-wake-lock';
import { cn } from '@/lib/cn';

export default function BrewTimerPage() {
  const router = useRouter();
  const state = useBrewTimerStore();
  const { recipe, currentStepIndex, status, completeStep, pause, resume, abort, begin } = state;
  const now = useNow();
  const [showFullSchedule, setShowFullSchedule] = useState(false);

  // 水出し等の数時間がかりの抽出では画面をつけっぱなしにする意味がないため対象外にする
  useWakeLock(status === 'running' && !!recipe && recipe.totalTimeSec < 1800);

  useEffect(() => {
    if (!recipe) router.replace('/brew/result');
  }, [recipe, router]);

  useEffect(() => {
    if (status === 'done') router.push('/brew/feedback');
  }, [status, router]);

  if (!recipe) return null;

  function handleAbort() {
    abort();
    router.push('/brew/result');
  }

  if (status === 'ready') {
    return (
      <div className="mx-auto flex max-w-md flex-col gap-6 px-5 py-6">
        <div className="flex items-center justify-between">
          <Button variant="ghost" size="icon" aria-label="やめる" onClick={handleAbort}>
            <X size={20} aria-hidden="true" />
          </Button>
          <span className="font-numeric text-callout text-muted-foreground">
            総時間 約{formatTime(recipe.totalTimeSec)}
          </span>
          <span className="w-10" aria-hidden="true" />
        </div>

        <div className="flex flex-col gap-2">
          <h2 className="font-semibold text-headline">全体の流れ</h2>
          <Card>
            <CardContent>
              <PourTimeline recipe={recipe} />
            </CardContent>
          </Card>
        </div>

        <Button size="lg" className="w-full" onClick={begin}>
          <Play size={20} aria-hidden="true" />
          スタート
        </Button>
      </div>
    );
  }

  const elapsedSec = getElapsedSec(state, now);
  const rows = buildTimelineRows(recipe.steps);
  const currentRow = rows[currentStepIndex];
  const nextRow = rows[currentStepIndex + 1];

  const latestValveStep = recipe.steps
    .slice(0, currentStepIndex + 1)
    .filter((s) => s.kind === 'valve')
    .at(-1);

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
        <div className="flex items-center justify-center gap-2 rounded-md border border-border bg-surface px-4 py-3">
          <span className="text-callout text-muted-foreground">次は</span>
          <nextRow.icon size={16} aria-hidden="true" />
          <span className="font-medium text-callout">{nextRow.label}</span>
          <span className="font-numeric text-caption text-muted-foreground">
            （{formatTime(nextRow.atSec)}〜）
          </span>
        </div>
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

      <div className="flex flex-col gap-2">
        <button
          type="button"
          className="flex items-center justify-between text-callout text-muted-foreground"
          onClick={() => setShowFullSchedule((v) => !v)}
          aria-expanded={showFullSchedule}
        >
          全体の流れ
          <span aria-hidden="true">{showFullSchedule ? '−' : '+'}</span>
        </button>
        {showFullSchedule && (
          <Card>
            <CardContent>
              <PourTimeline recipe={recipe} />
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
