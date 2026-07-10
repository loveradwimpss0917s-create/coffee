'use client';

import { Coffee, Trash2 } from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { BeanForm } from '@/components/beans/bean-form';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useBean, useDeleteBean, useUpdateBean } from '@/features/beans/queries';
import { useBrewWizardStore } from '@/features/brew/use-brew-wizard';

export default function BeanDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { data: bean, isLoading } = useBean(params.id);
  const updateBean = useUpdateBean();
  const deleteBean = useDeleteBean();
  const loadFrom = useBrewWizardStore((s) => s.loadFrom);
  const currentInput = useBrewWizardStore((s) => s.input);

  if (isLoading) {
    return (
      <div className="mx-auto flex max-w-md flex-col gap-4 px-5 py-8">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!bean) {
    return (
      <div className="mx-auto flex max-w-md flex-col gap-4 px-5 py-8">
        <p className="text-callout text-muted-foreground">豆が見つかりませんでした。</p>
      </div>
    );
  }

  function handleBrewWithBean() {
    if (!bean) return;
    loadFrom({
      ...currentInput,
      beanId: bean.id,
      bean: { roastLevel: bean.roastLevel, process: bean.process },
    });
    router.push('/brew');
  }

  return (
    <div className="mx-auto flex max-w-md flex-col gap-6 px-5 py-8">
      <div className="flex items-center justify-between">
        <h1 className="font-semibold text-title1">{bean.name}</h1>
        <Button
          variant="ghost"
          size="icon"
          aria-label="削除"
          onClick={() => {
            deleteBean.mutate(bean.id, { onSuccess: () => router.push('/beans') });
          }}
        >
          <Trash2 size={18} aria-hidden="true" />
        </Button>
      </div>

      <Button size="lg" className="w-full" onClick={handleBrewWithBean}>
        <Coffee size={18} aria-hidden="true" />
        この豆で淹れる
      </Button>

      <BeanForm
        defaultValues={bean}
        submitLabel="更新する"
        onSubmit={(values) => {
          updateBean.mutate({ id: bean.id, patch: values });
        }}
      />
    </div>
  );
}
