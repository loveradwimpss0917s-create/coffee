import { ENGINE_VERSION } from '@coffee-lab/engine';
import { Coffee } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function HomePage() {
  return (
    <div className="mx-auto flex max-w-md flex-col gap-6 px-5 py-10">
      <div className="flex flex-col gap-1">
        <h1 className="font-semibold text-title1">Coffee Recipe Lab</h1>
        <p className="text-muted-foreground">味から逆算する、コーヒードリップレシピ生成アプリ</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>今日の一杯を淹れる</CardTitle>
          <CardDescription>豆・器具・味の好みからレシピを生成します</CardDescription>
        </CardHeader>
        <CardContent>
          <Button size="lg" className="w-full">
            <Coffee aria-hidden="true" size={18} />
            淹れる
          </Button>
        </CardContent>
      </Card>

      <p className="font-numeric text-caption text-muted-foreground">engine v{ENGINE_VERSION}</p>
    </div>
  );
}
