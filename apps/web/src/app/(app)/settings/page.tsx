'use client';

import { ChevronRight, Sliders, Wheat } from 'lucide-react';
import Link from 'next/link';
import { SegmentedControl } from '@/components/shared/segmented-control';
import { Label } from '@/components/ui/label';
import { useSettings, useUpdateSettings } from '@/features/settings/queries';

export default function SettingsPage() {
  const { data: settings } = useSettings();
  const updateSettings = useUpdateSettings();

  return (
    <div className="mx-auto flex max-w-md flex-col gap-6 px-5 py-8">
      <h1 className="font-semibold text-title1">設定</h1>

      <div className="flex flex-col gap-2">
        <Label>テーマ</Label>
        <SegmentedControl
          value={settings?.theme ?? 'system'}
          onChange={(theme) => updateSettings.mutate({ theme })}
          options={[
            { value: 'system', label: '自動' },
            { value: 'light', label: 'ライト' },
            { value: 'dark', label: 'ダーク' },
          ]}
        />
      </div>

      <nav className="flex flex-col divide-y divide-border rounded-md border border-border bg-surface">
        <Link href="/gear" className="flex items-center gap-3 px-4 py-3">
          <Wheat size={18} aria-hidden="true" className="text-muted-foreground" />
          <span className="flex-1 text-callout">マイ器具</span>
          <ChevronRight size={16} aria-hidden="true" className="text-muted-foreground" />
        </Link>
        <Link href="/recipes" className="flex items-center gap-3 px-4 py-3">
          <Sliders size={18} aria-hidden="true" className="text-muted-foreground" />
          <span className="flex-1 text-callout">保存レシピ</span>
          <ChevronRight size={16} aria-hidden="true" className="text-muted-foreground" />
        </Link>
      </nav>
    </div>
  );
}
