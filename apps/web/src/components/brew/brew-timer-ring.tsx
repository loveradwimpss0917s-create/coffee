const SIZE = 260;
const STROKE = 10;
const RADIUS = (SIZE - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

function formatTime(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${String(s).padStart(2, '0')}`;
}

/**
 * 抽出タイマーの進行リング。時間の正確な表現のため spring ではなく linear（docs/05 §2.4）。
 */
export function BrewTimerRing({
  elapsedSec,
  totalSec,
  primaryLabel,
  secondaryLabel,
}: {
  elapsedSec: number;
  totalSec: number;
  primaryLabel: string;
  secondaryLabel: string;
}) {
  const progress = totalSec > 0 ? Math.min(1, elapsedSec / totalSec) : 0;
  const offset = CIRCUMFERENCE * (1 - progress);

  return (
    <div className="relative mx-auto flex size-64 items-center justify-center">
      <svg
        width={SIZE}
        height={SIZE}
        viewBox={`0 0 ${SIZE} ${SIZE}`}
        className="-rotate-90"
        aria-hidden="true"
      >
        <circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={RADIUS}
          fill="none"
          stroke="var(--color-border)"
          strokeWidth={STROKE}
        />
        <circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={RADIUS}
          fill="none"
          stroke="var(--color-primary)"
          strokeWidth={STROKE}
          strokeLinecap="round"
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 200ms linear' }}
        />
      </svg>
      <div
        className="absolute inset-0 flex flex-col items-center justify-center gap-1 px-6 text-center"
        aria-live="polite"
      >
        <span className="font-numeric text-display">{formatTime(elapsedSec)}</span>
        <span className="font-semibold text-headline">{primaryLabel}</span>
        <span className="text-callout text-muted-foreground">{secondaryLabel}</span>
      </div>
    </div>
  );
}
