import type { GrindResult } from '@coffee-lab/engine';
import { Badge } from '@/components/ui/badge';
import { GRIND_CONFIDENCE_LABELS } from '@/i18n/ja';

export function GrindDisplay({ grind }: { grind: GrindResult }) {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-2">
        <span className="font-semibold text-headline">{grind.generalLabel}</span>
      </div>
      {grind.setting && (
        <div className="flex items-center gap-2">
          <span className="font-numeric text-body text-muted-foreground">{grind.setting}</span>
          {grind.confidence && (
            <Badge variant={grind.confidence === 'estimated' ? 'outline' : 'secondary'}>
              {GRIND_CONFIDENCE_LABELS[grind.confidence]}
            </Badge>
          )}
        </div>
      )}
    </div>
  );
}
