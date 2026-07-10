'use client';

import { DRIPPERS } from '@coffee-lab/engine';
import { Coffee } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { BrewListItem } from '@/components/log/brew-list-item';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useBrewWizardStore } from '@/features/brew/use-brew-wizard';
import { useBrews } from '@/features/log/queries';
import { useSettings } from '@/features/settings/queries';

function greeting(): string {
  const hour = new Date().getHours();
  if (hour < 11) return 'おはようございます';
  if (hour < 17) return 'こんにちは';
  return 'こんばんは';
}

export default function HomePage() {
  const router = useRouter();
  const { data: settings } = useSettings();
  const { data: brews } = useBrews();
  const loadFrom = useBrewWizardStore((s) => s.loadFrom);

  useEffect(() => {
    if (settings && !settings.onboarded) router.replace('/onboarding');
  }, [settings, router]);

  const latest = brews?.[0];
  const latestDripper = latest && DRIPPERS.find((d) => d.id === latest.output.dripperId);

  function handleQuickRebrew(brew: NonNullable<typeof latest>) {
    loadFrom({
      beanId: brew.beanId,
      bean: brew.input.bean,
      equipment: brew.input.equipment,
      taste: brew.input.taste,
      strength: brew.input.strength,
      targetVolumeMl: brew.input.targetVolumeMl,
      serveStyle: brew.input.serveStyle,
    });
    router.push('/brew/result');
  }

  return (
    <div className="mx-auto flex max-w-md flex-col gap-6 px-5 py-8">
      <p className="text-callout text-muted-foreground">{greeting()}</p>

      <Card>
        <CardHeader>
          <CardTitle>今日の一杯を淹れる</CardTitle>
          <CardDescription>豆・器具・味の好みからレシピを生成します</CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild size="lg" className="w-full">
            <Link href="/brew">
              <Coffee aria-hidden="true" size={18} />
              淹れる
            </Link>
          </Button>
        </CardContent>
      </Card>

      {latest && latestDripper && (
        <div className="flex flex-col gap-2">
          <h2 className="font-semibold text-headline">クイック再抽出</h2>
          <button
            type="button"
            onClick={() => handleQuickRebrew(latest)}
            className="flex flex-col gap-1 rounded-md border border-border bg-surface px-4 py-3 text-left transition-colors duration-(--duration-fast) hover:bg-surface-raised"
          >
            <span className="font-medium text-callout">{latestDripper.name}</span>
            <span className="font-numeric text-caption text-muted-foreground">
              {latest.output.tempC}°C · 1:{latest.output.ratio}
            </span>
          </button>
        </div>
      )}

      {brews && brews.length > 0 && (
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-headline">最近の抽出</h2>
            <Link href="/log" className="text-callout text-primary">
              すべて見る
            </Link>
          </div>
          <div className="flex flex-col gap-2">
            {brews.slice(0, 3).map((brew) => (
              <BrewListItem key={brew.id} brew={brew} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
