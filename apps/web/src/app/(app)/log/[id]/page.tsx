'use client';

import { DRIPPERS } from '@coffee-lab/engine';
import { ChevronLeft, RotateCcw, Trash2 } from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { GrindDisplay } from '@/components/brew/grind-display';
import { PourTimeline } from '@/components/brew/pour-timeline';
import { TasteRadar } from '@/components/brew/taste-radar';
import { RatingStars } from '@/components/shared/rating-stars';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useBrewWizardStore } from '@/features/brew/use-brew-wizard';
import { useBrew, useDeleteBrew } from '@/features/log/queries';

export default function BrewDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { data: brew, isLoading } = useBrew(params.id);
  const loadFrom = useBrewWizardStore((s) => s.loadFrom);
  const deleteBrew = useDeleteBrew();

  if (isLoading) {
    return (
      <div className="mx-auto flex max-w-md flex-col gap-4 px-5 py-8">
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!brew) {
    return (
      <div className="mx-auto flex max-w-md flex-col gap-4 px-5 py-8">
        <p className="text-callout text-muted-foreground">記録が見つかりませんでした。</p>
      </div>
    );
  }

  const dripper = DRIPPERS.find((d) => d.id === brew.output.dripperId);

  function handleRebrew() {
    if (!brew) return;
    loadFrom({
      beanId: brew.beanId,
      bean: brew.input.bean,
      equipment: brew.input.equipment,
      taste: brew.input.taste,
      strength: brew.input.strength,
      targetVolumeMl: brew.input.targetVolumeMl,
      serveStyle: brew.input.serveStyle,
    });
    router.push('/brew/result');
  }

  return (
    <div className="mx-auto flex max-w-md flex-col gap-5 px-5 py-6">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" aria-label="戻る" onClick={() => router.push('/log')}>
          <ChevronLeft size={20} aria-hidden="true" />
        </Button>
        <h1 className="font-semibold text-title2">{dripper?.name}</h1>
      </div>

      {brew.rating !== undefined && (
        <div className="flex justify-center">
          <RatingStars value={brew.rating} readOnly />
        </div>
      )}

      <Card>
        <CardContent className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-4">
            <Stat label="粉量 / 湯量" value={`${brew.output.doseG}g / ${brew.output.waterG}g`} />
            <Stat label="比率" value={`1 : ${brew.output.ratio}`} />
            <Stat label="湯温" value={`${brew.output.tempC}°C`} />
            {brew.actualTimeSec !== undefined && (
              <Stat
                label="実測時間"
                value={`${Math.floor(brew.actualTimeSec / 60)}:${String(Math.round(brew.actualTimeSec % 60)).padStart(2, '0')}`}
              />
            )}
          </div>
          <GrindDisplay grind={brew.output.grind} />
        </CardContent>
      </Card>

      {brew.tasteFeedback && (
        <div className="flex flex-col gap-2">
          <h2 className="font-semibold text-headline">感じた味 vs 目標</h2>
          <Card>
            <CardContent>
              <TasteRadar profile={brew.tasteFeedback} compareWith={brew.input.taste} />
            </CardContent>
          </Card>
        </div>
      )}

      {brew.notes && (
        <Card>
          <CardContent className="text-callout">{brew.notes}</CardContent>
        </Card>
      )}

      <div className="flex flex-col gap-2">
        <h2 className="font-semibold text-headline">注湯スケジュール</h2>
        <Card>
          <CardContent>
            <PourTimeline recipe={brew.output} />
          </CardContent>
        </Card>
      </div>

      <div className="flex gap-2">
        <Button size="lg" className="flex-1" onClick={handleRebrew}>
          <RotateCcw size={16} aria-hidden="true" />
          同じ条件で再抽出
        </Button>
        <Button
          variant="outline"
          size="icon"
          aria-label="削除"
          onClick={() => {
            deleteBrew.mutate(brew.id, { onSuccess: () => router.push('/log') });
          }}
        >
          <Trash2 size={18} aria-hidden="true" />
        </Button>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-caption text-muted-foreground">{label}</span>
      <span className="font-numeric font-semibold text-headline">{value}</span>
    </div>
  );
}
