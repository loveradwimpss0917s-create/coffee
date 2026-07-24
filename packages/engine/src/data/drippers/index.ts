import type { DripperSpec } from '../types';
import { aeropress } from './aeropress';
import { aeropressEspresso } from './aeropress-espresso';
import { april } from './april';
import { cafecFlower } from './cafec-flower';
import { clever } from './clever';
import { frenchPress } from './french-press';
import { harioMizudashi } from './hario-mizudashi';
import { harioSwitch } from './hario-switch';
import { harioV60 } from './hario-v60';
import { iwakiMizudashi } from './iwaki-mizudashi';
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
  aeropressEspresso,
  frenchPress,
  iwakiMizudashi,
  harioMizudashi,
];

const DRIPPER_BY_ID = new Map(DRIPPERS.map((d) => [d.id, d]));

export function getDripper(id: string): DripperSpec | undefined {
  return DRIPPER_BY_ID.get(id);
}

export {
  aeropress,
  aeropressEspresso,
  april,
  cafecFlower,
  clever,
  frenchPress,
  harioMizudashi,
  harioSwitch,
  harioV60,
  iwakiMizudashi,
  kalitaWave,
  kono,
  orea,
  origami,
};
