'use client';

import { ChevronLeft } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ARRANGE_RECIPES } from '@/lib/arrange-recipes';

export default function ArrangeRecipesPage() {
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
        AeroPressで淹れた濃縮コーヒーを、他の飲み物と組み合わせるレシピです。通常のレシピ生成とは別に、定番の組み合わせを固定パラメータでまとめています。
      </p>

      <div className="flex flex-col gap-4">
        {ARRANGE_RECIPES.map((recipe) => (
          <Card key={recipe.id}>
            <CardHeader>
              <CardTitle>{recipe.name}</CardTitle>
              <CardDescription>{recipe.tagline}</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              <div className="grid grid-cols-2 gap-3">
                <ArrangeStat label="粉量" value={`${recipe.baseRecipe.doseG}g`} />
                <ArrangeStat
                  label="お湯"
                  value={`${recipe.baseRecipe.waterG}g / ${recipe.baseRecipe.tempC}°C`}
                />
                <ArrangeStat
                  label="抽出方法"
                  value={recipe.baseRecipe.method}
                  className="col-span-2"
                />
                <ArrangeStat label="割るもの" value={recipe.mixer.amount} className="col-span-2" />
              </div>
              <p className="text-callout">{recipe.servingNote}</p>
              <p className="text-caption text-muted-foreground">{recipe.sourceNote}</p>
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
