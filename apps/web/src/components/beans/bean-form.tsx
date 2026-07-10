'use client';

import { processSchema, roastLevelSchema } from '@coffee-lab/engine';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { PROCESS_LABELS, ROAST_LEVEL_LABELS } from '@/i18n/ja';
import type { Bean } from '@/lib/schemas';

const formSchema = z.object({
  name: z.string().min(1, '豆の名前を入力してください').max(80),
  roaster: z.string().max(80).optional(),
  origin: z.string().max(120).optional(),
  process: processSchema,
  roastLevel: roastLevelSchema,
  notes: z.string().max(1000).optional(),
});
export type BeanFormValues = z.infer<typeof formSchema>;

export function BeanForm({
  defaultValues,
  onSubmit,
  submitLabel = '保存',
}: {
  defaultValues?: Partial<Bean>;
  onSubmit: (values: BeanFormValues) => void;
  submitLabel?: string;
}) {
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<BeanFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: defaultValues?.name ?? '',
      roaster: defaultValues?.roaster ?? '',
      origin: defaultValues?.origin ?? '',
      process: defaultValues?.process ?? 'washed',
      roastLevel: defaultValues?.roastLevel ?? 'medium',
      notes: defaultValues?.notes ?? '',
    },
  });

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="flex flex-col gap-5"
      aria-label="豆の登録フォーム"
    >
      <div className="flex flex-col gap-2">
        <Label htmlFor="name">豆の名前</Label>
        <Input id="name" placeholder="例: エチオピア イルガチェフェ" {...register('name')} />
        {errors.name && <p className="text-caption text-destructive">{errors.name.message}</p>}
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="roaster">ロースター</Label>
        <Input id="roaster" placeholder="任意" {...register('roaster')} />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="origin">産地</Label>
        <Input id="origin" placeholder="任意" {...register('origin')} />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="roastLevel">焙煎度</Label>
        <Select
          value={watch('roastLevel')}
          onValueChange={(v) => setValue('roastLevel', v as BeanFormValues['roastLevel'])}
        >
          <SelectTrigger id="roastLevel">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(ROAST_LEVEL_LABELS).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="process">精製方法</Label>
        <Select
          value={watch('process')}
          onValueChange={(v) => setValue('process', v as BeanFormValues['process'])}
        >
          <SelectTrigger id="process">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(PROCESS_LABELS).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="notes">メモ</Label>
        <Textarea id="notes" placeholder="任意" rows={3} {...register('notes')} />
      </div>

      <Button type="submit" size="lg" className="w-full">
        {submitLabel}
      </Button>
    </form>
  );
}
