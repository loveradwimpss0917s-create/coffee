'use client';

import { DRIPPERS } from '@coffee-lab/engine';
import { BookMarked, Coffee } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { EmptyState } from '@/components/shared/empty-state';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useBrewWizardStore } from '@/features/brew/use-brew-wizard';
import { useSavedRecipes } from '@/features/recipes/queries';

export default function SavedRecipesPage() {
  const router = useRouter();
  const { data: recipes, isLoading } = useSavedRecipes();
  const loadFrom = useBrewWizardStore((s) => s.loadFrom);

  function handleOpen(recipe: NonNullable<typeof recipes>[number]) {
    loadFrom({
      beanId: recipe.beanId,
      bean: recipe.input.bean,
      equipment: recipe.input.equipment,
      taste: recipe.input.taste,
      strength: recipe.input.strength,
      targetVolumeMl: recipe.input.targetVolumeMl,
      serveStyle: recipe.input.serveStyle,
    });
    router.push('/brew/result');
  }

  return (
    <div className="mx-auto flex max-w-md flex-col gap-4 px-5 py-8">
      <h1 className="font-semibold text-title1">保存レシピ</h1>

      {isLoading && <Skeleton className="h-16 w-full" />}

      {!isLoading && recipes?.length === 0 && (
        <EmptyState
          icon={BookMarked}
          title="保存レシピはまだありません"
          description="生成したレシピを保存すると、ここから再利用できます。"
          action={
            <Button asChild>
              <Link href="/brew">
                <Coffee size={16} aria-hidden="true" />
                淹れる
              </Link>
            </Button>
          }
        />
      )}

      {!isLoading && recipes && recipes.length > 0 && (
        <div className="flex flex-col gap-2">
          {recipes.map((recipe) => {
            const dripper = DRIPPERS.find((d) => d.id === recipe.output.dripperId);
            return (
              <button
                key={recipe.id}
                type="button"
                onClick={() => handleOpen(recipe)}
                className="flex flex-col gap-1 rounded-md border border-border bg-surface px-4 py-3 text-left transition-colors duration-(--duration-fast) hover:bg-surface-raised"
              >
                <span className="font-medium text-callout">{recipe.title}</span>
                <span className="font-numeric text-caption text-muted-foreground">
                  {dripper?.name} · {recipe.output.tempC}°C · 1:{recipe.output.ratio}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
