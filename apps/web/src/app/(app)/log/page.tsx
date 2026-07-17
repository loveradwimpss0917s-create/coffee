'use client';

import { Coffee, NotebookText } from 'lucide-react';
import Link from 'next/link';
import { BrewListItem } from '@/components/log/brew-list-item';
import { EmptyState } from '@/components/shared/empty-state';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useBrewWizardStore } from '@/features/brew/use-brew-wizard';
import { useBrews } from '@/features/log/queries';

export default function LogPage() {
  const { data: brews, isLoading } = useBrews();
  const resetWizard = useBrewWizardStore((s) => s.reset);

  return (
    <div className="mx-auto flex max-w-md flex-col gap-4 px-5 py-8">
      <h1 className="font-semibold text-title1">抽出ログ</h1>

      {isLoading && (
        <div className="flex flex-col gap-2">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
        </div>
      )}

      {!isLoading && brews?.length === 0 && (
        <EmptyState
          icon={NotebookText}
          title="まだ抽出記録がありません"
          description="最初の一杯を淹れてみましょう。"
          action={
            <Button asChild>
              <Link href="/brew" onClick={resetWizard}>
                <Coffee size={16} aria-hidden="true" />
                淹れる
              </Link>
            </Button>
          }
        />
      )}

      {!isLoading && brews && brews.length > 0 && (
        <div className="flex flex-col gap-2">
          {brews.map((brew) => (
            <BrewListItem key={brew.id} brew={brew} />
          ))}
        </div>
      )}
    </div>
  );
}
