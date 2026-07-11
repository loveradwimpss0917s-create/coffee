'use client';

import { DRIPPERS, generateRecipe } from '@coffee-lab/engine';
import { AlertTriangle, ChevronLeft, Play } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { GrindDisplay } from '@/components/brew/grind-display';
import { formatTime, PourTimeline } from '@/components/brew/pour-timeline';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useBrewTimerStore } from '@/features/brew/use-brew-timer';
import { toBrewInput, useBrewWizardStore } from '@/features/brew/use-brew-wizard';
import { useCreateSavedRecipe } from '@/features/recipes/queries';
import { renderRationale, SERVE_STYLE_LABELS } from '@/i18n/ja';

export default function BrewResultPage() {
  const router = useRouter();
  const wizardInput = useBrewWizardStore((s) => s.input);
  const startTimer = useBrewTimerStore((s) => s.start);
  const createSavedRecipe = useCreateSavedRecipe();
  const [showRationale, setShowRationale] = useState(false);

  const brewInput = useMemo(() => toBrewInput(wizardInput), [wizardInput]);
  const recipe = useMemo(() => (brewInput ? generateRecipe(brewInput) : undefined), [brewInput]);
  const dripper = useMemo(
    () => DRIPPERS.find((d) => d.id === recipe?.dripperId),
    [recipe?.dripperId],
  );

  if (!brewInput || !recipe) {
    return (
      <div className="mx-auto flex max-w-md flex-col gap-4 px-5 py-8">
        <p className="text-callout text-muted-foreground">
          器具が選択されていません。ウィザードからやり直してください。
        </p>
        <Button onClick={() => router.push('/brew')}>ウィザードに戻る</Button>
      </div>
    );
  }

  const isColdDrip = dripper?.brewType === 'coldDrip';

  function handleSave() {
    if (!recipe || !brewInput) return;
    createSavedRecipe.mutate(
      {
        beanId: wizardInput.beanId,
        title: `${dripper?.name ?? ''} のレシピ`,
        input: brewInput,
        output: recipe,
      },
      { onSuccess: () => toast.success('レシピを保存しました') },
    );
  }

  function handleStartBrewing() {
    if (!recipe) return;
    startTimer(recipe);
    router.push('/brew/timer');
  }

  return (
    <div className="mx-auto flex max-w-md flex-col gap-5 px-5 py-6">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" aria-label="戻る" onClick={() => router.push('/brew')}>
          <ChevronLeft size={20} aria-hidden="true" />
        </Button>
        <h1 className="font-semibold text-title2">
          {dripper?.name}
          {recipe.input.serveStyle === 'iced' && ` · ${SERVE_STYLE_LABELS.iced}`}
        </h1>
        <Button variant="outline" size="sm" className="ml-auto" onClick={handleSave}>
          保存
        </Button>
      </div>

      {recipe.warnings.length > 0 && (
        <Card className="border-primary/40 bg-surface-raised">
          <CardContent className="flex flex-col gap-1">
            {recipe.warnings.map((w) => (
              <p key={w} className="flex items-start gap-2 text-callout">
                <AlertTriangle
                  size={16}
                  aria-hidden="true"
                  className="mt-0.5 shrink-0 text-primary"
                />
                {w}
              </p>
            ))}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-4">
            <Stat label="粉量 / 湯量" value={`${recipe.doseG}g / ${recipe.waterG}g`} />
            <Stat label="比率" value={`1 : ${recipe.ratio}`} />
            <Stat label={isColdDrip ? '水温' : '湯温'} value={`${recipe.tempC}°C`} />
            <Stat label="総時間" value={`約${formatTime(recipe.totalTimeSec)}`} />
          </div>
          <GrindDisplay grind={recipe.grind} />
        </CardContent>
      </Card>

      <div className="flex flex-col gap-2">
        <h2 className="font-semibold text-headline">注湯スケジュール</h2>
        <Card>
          <CardContent>
            <PourTimeline recipe={recipe} />
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col gap-2">
        <button
          type="button"
          className="flex items-center justify-between text-callout text-muted-foreground"
          onClick={() => setShowRationale((v) => !v)}
          aria-expanded={showRationale}
        >
          なぜこのレシピ？
          <span aria-hidden="true">{showRationale ? '−' : '+'}</span>
        </button>
        {showRationale && (
          <Card>
            <CardContent className="flex flex-col gap-2">
              {recipe.rationale.map((r) => {
                const text = renderRationale(r);
                if (!text) return null;
                return (
                  <p key={`${r.paramKey}-${r.templateId}`} className="text-callout">
                    {text}
                  </p>
                );
              })}
            </CardContent>
          </Card>
        )}
      </div>

      <Button size="lg" className="w-full" onClick={handleStartBrewing}>
        <Play size={18} aria-hidden="true" />
        抽出をはじめる
      </Button>
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
