'use client';

import { Plus, Wheat } from 'lucide-react';
import Link from 'next/link';
import { BeanCard } from '@/components/beans/bean-card';
import { EmptyState } from '@/components/shared/empty-state';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useBeans } from '@/features/beans/queries';

export default function BeansPage() {
  const { data: beans, isLoading } = useBeans();

  return (
    <div className="mx-auto flex max-w-md flex-col gap-4 px-5 py-8">
      <div className="flex items-center justify-between">
        <h1 className="font-semibold text-title1">豆</h1>
        <Button asChild size="sm">
          <Link href="/beans/new">
            <Plus size={16} aria-hidden="true" />
            追加
          </Link>
        </Button>
      </div>

      {isLoading && (
        <div className="flex flex-col gap-2">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
        </div>
      )}

      {!isLoading && beans?.length === 0 && (
        <EmptyState
          icon={Wheat}
          title="豆が登録されていません"
          description="お気に入りの豆を登録すると、レシピ生成時に選べるようになります。"
          action={
            <Button asChild>
              <Link href="/beans/new">最初の豆を登録</Link>
            </Button>
          }
        />
      )}

      {!isLoading && beans && beans.length > 0 && (
        <div className="flex flex-col gap-2">
          {beans.map((bean) => (
            <BeanCard key={bean.id} bean={bean} />
          ))}
        </div>
      )}
    </div>
  );
}
