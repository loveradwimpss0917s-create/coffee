import type { DripperSpec } from '../types';
import { aeropress } from './aeropress';
import { april } from './april';
import { cafecFlower } from './cafec-flower';
import { clever } from './clever';
import { frenchPress } from './french-press';
import { harioSwitch } from './hario-switch';
import { harioV60 } from './hario-v60';
import { kalitaWave } from './kalita-wave';
import { kono } from './kono';
import { orea } from './orea';
import { origami } from './origami';

/**
 * ドリッパー登録レジストリ。新規追加は 1 ファイル + このリストへの追記のみ（docs/11 §6）。
 */
export const DRIPPERS: readonly DripperSpec[] = [
  harioV60,
  harioSwitch,
  origami,
  cafecFlower,
  kalitaWave,
  kono,
  april,
  orea,
  clever,
  aeropress,
  frenchPress,
];

const DRIPPER_BY_ID = new Map(DRIPPERS.map((d) => [d.id, d]));

export function getDripper(id: string): DripperSpec | undefined {
  return DRIPPER_BY_ID.get(id);
}

export {
  aeropress,
  april,
  cafecFlower,
  clever,
  frenchPress,
  harioSwitch,
  harioV60,
  kalitaWave,
  kono,
  orea,
  origami,
};
