import type { GrinderSpec } from '../types';
import { zpressoJxPro } from './1zpresso-jx-pro';
import { zpressoKUltra } from './1zpresso-k-ultra';
import { zpressoZp6 } from './1zpresso-zp6';
import { baratzaEncore } from './baratza-encore';
import { comandanteC40 } from './comandante-c40';
import { delonghiKg521 } from './delonghi-kg521';
import { df64 } from './df64';
import { fellowOde2 } from './fellow-ode2';
import { kingrinderK6 } from './kingrinder-k6';
import { mahlkonigEk43 } from './mahlkonig-ek43';
import { nicheZero } from './niche-zero';
import { timemoreC3 } from './timemore-c3';
import { wilfaSvart } from './wilfa-svart';

/**
 * グラインダー登録レジストリ。新規追加は 1 ファイル + このリストへの追記のみ（docs/11 §6）。
 * `grinderId` が未指定/未登録の場合は一般表記(μm)のみを返す（generic 相当、docs/11 §4）。
 */
export const GRINDERS: readonly GrinderSpec[] = [
  delonghiKg521,
  comandanteC40,
  zpressoJxPro,
  zpressoKUltra,
  zpressoZp6,
  timemoreC3,
  kingrinderK6,
  baratzaEncore,
  fellowOde2,
  wilfaSvart,
  nicheZero,
  df64,
  mahlkonigEk43,
];

const GRINDER_BY_ID = new Map(GRINDERS.map((g) => [g.id, g]));

export function getGrinder(id: string): GrinderSpec | undefined {
  return GRINDER_BY_ID.get(id);
}

export {
  baratzaEncore,
  comandanteC40,
  delonghiKg521,
  df64,
  fellowOde2,
  kingrinderK6,
  mahlkonigEk43,
  nicheZero,
  timemoreC3,
  wilfaSvart,
  zpressoJxPro,
  zpressoKUltra,
  zpressoZp6,
};
