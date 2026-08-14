'use client';

import { ORIGIN_PROFILES } from '@coffee-lab/engine';
import { X } from 'lucide-react';
import { useId, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const MAX_ORIGINS = 5;

/**
 * 産地の複数選択入力（自由入力 + サジェスト、ブレンド対応、docs/07 §3.4）。
 * 既知の産地（packages/engine のデータ）は datalist でサジェストしつつ、
 * 未知の表記もそのまま自由入力として追加できる。
 */
export function OriginsInput({
  value,
  onChange,
  label = '産地',
}: {
  value: string[];
  onChange: (origins: string[]) => void;
  label?: string;
}) {
  const [draft, setDraft] = useState('');
  const inputId = useId();
  const listId = `${inputId}-suggestions`;

  function addOrigin() {
    const trimmed = draft.trim();
    if (!trimmed || value.includes(trimmed) || value.length >= MAX_ORIGINS) return;
    onChange([...value, trimmed]);
    setDraft('');
  }

  function removeOrigin(origin: string) {
    onChange(value.filter((o) => o !== origin));
  }

  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor={inputId}>{label}</Label>
      {value.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {value.map((origin) => (
            <Badge key={origin} variant="secondary" className="gap-1 py-1 pr-1 pl-2.5">
              {origin}
              <button
                type="button"
                onClick={() => removeOrigin(origin)}
                aria-label={`${origin}を削除`}
                className="rounded-full p-0.5 hover:bg-surface"
              >
                <X size={12} aria-hidden="true" />
              </button>
            </Badge>
          ))}
        </div>
      )}
      <div className="flex gap-2">
        <Input
          id={inputId}
          list={listId}
          placeholder="任意（ブレンドは複数追加できます）"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              addOrigin();
            }
          }}
        />
        <Button type="button" variant="outline" onClick={addOrigin} disabled={!draft.trim()}>
          追加
        </Button>
      </div>
      <datalist id={listId}>
        {ORIGIN_PROFILES.map((origin) => (
          <option key={origin.id} value={origin.name} />
        ))}
      </datalist>
    </div>
  );
}
