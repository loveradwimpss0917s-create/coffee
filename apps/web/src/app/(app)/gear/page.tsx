'use client';

import { GearForm } from '@/components/shared/gear-form';
import { useSettings, useUpdateSettings } from '@/features/settings/queries';
import { DEFAULT_SETTINGS } from '@/lib/schemas';

export default function GearPage() {
  const { data: settings } = useSettings();
  const updateSettings = useUpdateSettings();

  return (
    <div className="mx-auto flex max-w-md flex-col gap-6 px-5 py-8">
      <h1 className="font-semibold text-title1">マイ器具</h1>
      <GearForm
        value={settings ?? DEFAULT_SETTINGS}
        onChange={(patch) => updateSettings.mutate(patch)}
      />
    </div>
  );
}
