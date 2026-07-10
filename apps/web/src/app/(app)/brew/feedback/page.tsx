'use client';

import { BALANCED_TASTE_PROFILE } from '@coffee-lab/engine';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { TasteSliders } from '@/components/brew/taste-sliders';
import { RatingStars } from '@/components/shared/rating-stars';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { getElapsedSec, useBrewTimerStore } from '@/features/brew/use-brew-timer';
import { useBrewWizardStore } from '@/features/brew/use-brew-wizard';
import { useCreateBrew } from '@/features/log/queries';

export default function BrewFeedbackPage() {
  const router = useRouter();
  const timerState = useBrewTimerStore();
  const { recipe, abort } = timerState;
  const wizardBeanId = useBrewWizardStore((s) => s.input.beanId);
  const createBrew = useCreateBrew();

  const [rating, setRating] = useState(0);
  const [taste, setTaste] = useState(BALANCED_TASTE_PROFILE);
  const [notes, setNotes] = useState('');
  const [tds, setTds] = useState('');
  // 保存完了後に abort() で recipe が null になっても home へ誤リダイレクトしないためのガード
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (!recipe && !submitted) router.replace('/');
  }, [recipe, submitted, router]);

  if (!recipe && !submitted) return null;

  function handleSubmit(skip: boolean) {
    if (!recipe) return;
    const actualTimeSec = Math.round(getElapsedSec(timerState, Date.now()));
    createBrew.mutate(
      {
        recipeId: undefined,
        beanId: wizardBeanId,
        input: recipe.input,
        output: recipe,
        brewedAt: Date.now(),
        rating: skip ? undefined : rating || undefined,
        tasteFeedback: skip ? undefined : taste,
        tds: skip || !tds ? undefined : Number(tds),
        notes: skip || !notes ? undefined : notes,
        actualTimeSec,
      },
      {
        onSuccess: (brew) => {
          setSubmitted(true);
          abort();
          router.push(`/log/${brew.id}`);
        },
      },
    );
  }

  return (
    <div className="mx-auto flex max-w-md flex-col gap-6 px-5 py-8">
      <div className="flex flex-col items-center gap-2 text-center">
        <h1 className="font-semibold text-title2">今日の一杯はどうでしたか？</h1>
        <RatingStars value={rating} onChange={setRating} />
      </div>

      <div className="flex flex-col gap-4">
        <p className="text-callout text-muted-foreground">詳しく教えてください（任意）</p>
        <TasteSliders value={taste} onChange={setTaste} />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="notes">メモ</Label>
        <Textarea id="notes" rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="tds">TDS（任意・%）</Label>
        <Input
          id="tds"
          type="number"
          inputMode="decimal"
          step="0.01"
          value={tds}
          onChange={(e) => setTds(e.target.value)}
        />
      </div>

      <div className="flex flex-col gap-2">
        <Button size="lg" className="w-full" onClick={() => handleSubmit(false)}>
          保存する
        </Button>
        <Button variant="ghost" size="lg" className="w-full" onClick={() => handleSubmit(true)}>
          スキップ
        </Button>
      </div>
    </div>
  );
}
