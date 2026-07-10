'use client';

import { useRouter } from 'next/navigation';
import { BeanForm } from '@/components/beans/bean-form';
import { useCreateBean } from '@/features/beans/queries';

export default function NewBeanPage() {
  const router = useRouter();
  const createBean = useCreateBean();

  return (
    <div className="mx-auto flex max-w-md flex-col gap-6 px-5 py-8">
      <h1 className="font-semibold text-title1">豆を登録</h1>
      <BeanForm
        submitLabel="登録する"
        onSubmit={(values) => {
          createBean.mutate(values, {
            onSuccess: () => router.push('/beans'),
          });
        }}
      />
    </div>
  );
}
