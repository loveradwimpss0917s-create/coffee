import { DRIPPERS } from '@coffee-lab/engine';
import { Star } from 'lucide-react';
import Link from 'next/link';
import type { Brew } from '@/lib/schemas';

function formatDate(ms: number): string {
  const d = new Date(ms);
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

export function BrewListItem({ brew }: { brew: Brew }) {
  const dripper = DRIPPERS.find((d) => d.id === brew.output.dripperId);

  return (
    <Link
      href={`/log/${brew.id}`}
      className="flex items-center justify-between gap-3 rounded-md border border-border bg-surface px-4 py-3 transition-colors duration-(--duration-fast) hover:bg-surface-raised"
    >
      <div className="flex flex-col gap-0.5">
        <span className="font-medium text-callout">{dripper?.name ?? brew.output.dripperId}</span>
        <span className="font-numeric text-caption text-muted-foreground">
          {formatDate(brew.brewedAt)} · {brew.output.tempC}°C · 1:{brew.output.ratio}
        </span>
      </div>
      {brew.rating !== undefined && (
        <span className="flex items-center gap-1 text-caption text-muted-foreground">
          <Star size={14} className="fill-primary text-primary" aria-hidden="true" />
          {brew.rating}
        </span>
      )}
    </Link>
  );
}
