'use client';

import { ChevronLeft, Play } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMemo } from 'react';
import { GrindDisplay } from '@/components/brew/grind-display';
import { PourTimeline } from '@/components/brew/pour-timeline';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useBrewTimerStore } from '@/features/brew/use-brew-timer';
import { ARRANGE_RECIPES, arrangeRecipeToRecipe } from '@/lib/arrange-recipes';

export default function ArrangeRecipesPage() {
  const router = useRouter();
  const prepareTimer = useBrewTimerStore((s) => s.prepare);

  const items = useMemo(
    () => ARRANGE_RECIPES.map((arrange) => ({ arrange, recipe: arrangeRecipeToRecipe(arrange) })),
    [],
  );

  function handleStart(recipe: ReturnType<typeof arrangeRecipeToRecipe>) {
    prepareTimer(recipe);
    router.push('/brew/timer');
  }

  return (
    <div className="mx-auto flex max-w-md flex-col gap-5 px-5 py-6">
      <div className="flex items-center gap-2">
        <Button asChild variant="ghost" size="icon" aria-label="戻る">
          <Link href="/">
            <ChevronLeft size={20} aria-hidden="true" />
          </Link>
        </Button>
        <h1 className="font-semibold text-title2">アレンジレシピ</h1>
      </div>
      <p className="text-callout text-muted-foreground">
        AeroPressで淹れた濃縮コーヒーを、他の飲み物と組み合わせるレシピです。通常のレシピ生成とは別に、定番の組み合わせを固定パラメータでまとめています。他のレシピと同じように、注湯スケジュールとタイマーで淹れられます。
      </p>

      <div className="flex flex-col gap-4">
        {items.map(({ arrange, recipe }) => (
          <Card key={arrange.id}>
            <CardHeader>
              <CardTitle>{arrange.name}</CardTitle>
              <CardDescription>{arrange.tagline}</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-3">
                <ArrangeStat label="粉量 / 湯量" value={`${recipe.doseG}g / ${recipe.waterG}g`} />
                <ArrangeStat label="湯温" value={`${recipe.tempC}°C`} />
                <ArrangeStat label="割るもの" value={arrange.mixer.amount} className="col-span-2" />
              </div>
              <GrindDisplay grind={recipe.grind} />
              <p className="text-callout text-muted-foreground">{arrange.baseRecipe.method}</p>

              <div className="flex flex-col gap-2">
                <h3 className="text-callout text-muted-foreground">注湯スケジュール</h3>
                <PourTimeline recipe={recipe} />
              </div>

              <p className="text-callout">{arrange.servingNote}</p>
              <p className="text-caption text-muted-foreground">{arrange.sourceNote}</p>

              <Button size="lg" className="w-full" onClick={() => handleStart(recipe)}>
                <Play size={18} aria-hidden="true" />
                抽出をはじめる
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

function ArrangeStat({
  label,
  value,
  className,
}: {
  label: string;
  value: string;
  className?: string;
}) {
  return (
    <div className={`flex flex-col gap-0.5 ${className ?? ''}`}>
      <span className="text-caption text-muted-foreground">{label}</span>
      <span className="font-medium font-numeric text-callout">{value}</span>
    </div>
  );
}
