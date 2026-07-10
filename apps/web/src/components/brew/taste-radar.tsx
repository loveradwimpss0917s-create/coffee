import { TASTE_AXIS_KEYS, type TasteProfile } from '@coffee-lab/engine';
import { TASTE_AXIS_LABELS } from '@/i18n/ja';

const SIZE = 300;
const CENTER = SIZE / 2;
const MAX_RADIUS = 70;
const LABEL_RADIUS = MAX_RADIUS + 25;

function axisPoint(index: number, magnitude: number) {
  // 5軸を円周上に等間隔配置。0時方向(酸味)から時計回り。
  const angle = (Math.PI * 2 * index) / TASTE_AXIS_KEYS.length - Math.PI / 2;
  const radius = ((magnitude + 2) / 4) * MAX_RADIUS;
  return { x: CENTER + radius * Math.cos(angle), y: CENTER + radius * Math.sin(angle) };
}

/** ラベルは円周上の位置に応じて左揃え/中央/右揃えを切り替え、viewBox端での見切れを防ぐ */
function labelPoint(index: number) {
  const angle = (Math.PI * 2 * index) / TASTE_AXIS_KEYS.length - Math.PI / 2;
  const x = CENTER + LABEL_RADIUS * Math.cos(angle);
  const y = CENTER + LABEL_RADIUS * Math.sin(angle);
  const cos = Math.cos(angle);
  const textAnchor: 'start' | 'end' | 'middle' =
    cos > 0.3 ? 'start' : cos < -0.3 ? 'end' : 'middle';
  return { x, y, textAnchor };
}

/** 味覚5軸レーダーチャート。依存ライブラリなしのSVG自作（docs/09 §3.2）。 */
export function TasteRadar({
  profile,
  compareWith,
}: {
  profile: TasteProfile;
  compareWith?: TasteProfile;
}) {
  const points = TASTE_AXIS_KEYS.map((axis, i) => axisPoint(i, profile[axis]));
  const polygon = points.map((p) => `${p.x},${p.y}`).join(' ');

  const comparePoints = compareWith
    ? TASTE_AXIS_KEYS.map((axis, i) => axisPoint(i, compareWith[axis]))
    : null;
  const comparePolygon = comparePoints?.map((p) => `${p.x},${p.y}`).join(' ');

  const gridLevels = [0.25, 0.5, 0.75, 1];

  return (
    <svg
      viewBox={`0 0 ${SIZE} ${SIZE}`}
      role="img"
      aria-label="味覚プロファイルのレーダーチャート"
      className="mx-auto h-auto w-full max-w-72"
    >
      {gridLevels.map((level) => {
        const ring = TASTE_AXIS_KEYS.map((_, i) => {
          const angle = (Math.PI * 2 * i) / TASTE_AXIS_KEYS.length - Math.PI / 2;
          const r = level * MAX_RADIUS;
          return `${CENTER + r * Math.cos(angle)},${CENTER + r * Math.sin(angle)}`;
        }).join(' ');
        return (
          <polygon
            key={level}
            points={ring}
            fill="none"
            stroke="var(--color-border)"
            strokeWidth={1}
          />
        );
      })}

      {TASTE_AXIS_KEYS.map((axis, i) => {
        const outer = axisPoint(i, 2);
        return (
          <line
            key={axis}
            x1={CENTER}
            y1={CENTER}
            x2={outer.x}
            y2={outer.y}
            stroke="var(--color-border)"
            strokeWidth={1}
          />
        );
      })}

      {comparePolygon && (
        <polygon
          points={comparePolygon}
          fill="var(--color-muted-foreground)"
          fillOpacity={0.12}
          stroke="var(--color-muted-foreground)"
          strokeWidth={1.5}
          strokeDasharray="4 3"
        />
      )}

      <polygon
        points={polygon}
        fill="var(--color-primary)"
        fillOpacity={0.25}
        stroke="var(--color-primary)"
        strokeWidth={2}
      />
      {points.map((p, i) => (
        <circle key={TASTE_AXIS_KEYS[i]} cx={p.x} cy={p.y} r={3} fill="var(--color-primary)" />
      ))}

      {TASTE_AXIS_KEYS.map((axis, i) => {
        const p = labelPoint(i);
        return (
          <text
            key={axis}
            x={p.x}
            y={p.y}
            textAnchor={p.textAnchor}
            dominantBaseline="middle"
            fontSize={12}
            fill="var(--color-muted-foreground)"
          >
            {TASTE_AXIS_LABELS[axis]}
          </text>
        );
      })}
    </svg>
  );
}
