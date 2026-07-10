'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { GearForm } from '@/components/shared/gear-form';
import { Button } from '@/components/ui/button';
import { useSettings, useUpdateSettings } from '@/features/settings/queries';
import { DEFAULT_SETTINGS } from '@/lib/schemas';

export default function OnboardingPage() {
  const router = useRouter();
  const { data: settings } = useSettings();
  const updateSettings = useUpdateSettings();
  const [gear, setGear] = useState(() => settings ?? DEFAULT_SETTINGS);

  function handleFinish() {
    updateSettings.mutate({ ...gear, onboarded: true });
    router.push('/');
  }

  return (
    <div className="mx-auto flex max-w-md flex-col gap-6 px-5 py-10">
      <div className="flex flex-col gap-1">
        <h1 className="font-semibold text-title1">はじめに、器具を教えてください</h1>
        <p className="text-callout text-muted-foreground">
          あとから設定画面でいつでも変更できます。
        </p>
      </div>

      <GearForm value={gear} onChange={(patch) => setGear((prev) => ({ ...prev, ...patch }))} />

      <Button size="lg" className="w-full" onClick={handleFinish}>
        はじめる
      </Button>
      <button
        type="button"
        className="text-callout text-muted-foreground underline underline-offset-4"
        onClick={handleFinish}
      >
        あとで設定する
      </button>
    </div>
  );
}
