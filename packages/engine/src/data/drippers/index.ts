import type { DripperSpec } from '../types';
import { aeropress } from './aeropress';
import { clever } from './clever';
import { harioSwitch } from './hario-switch';
import { harioV60 } from './hario-v60';
import { kalitaWave } from './kalita-wave';

/**
 * ドリッパー登録レジストリ。新規追加は 1 ファイル + このリストへの追記のみ（docs/11 §6）。
 */
export const DRIPPERS: readonly DripperSpec[] = [
  harioV60,
  harioSwitch,
  kalitaWave,
  clever,
  aeropress,
];

const DRIPPER_BY_ID = new Map(DRIPPERS.map((d) => [d.id, d]));

export function getDripper(id: string): DripperSpec | undefined {
  return DRIPPER_BY_ID.get(id);
}

export { aeropress, clever, harioSwitch, harioV60, kalitaWave };
