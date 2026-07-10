import type { GrinderSpec } from '../types';
import { zpressoKUltra } from './1zpresso-k-ultra';
import { comandanteC40 } from './comandante-c40';
import { delonghiKg521 } from './delonghi-kg521';
import { kingrinderK6 } from './kingrinder-k6';
import { timemoreC3 } from './timemore-c3';

/**
 * グラインダー登録レジストリ。新規追加は 1 ファイル + このリストへの追記のみ（docs/11 §6）。
 * `grinderId` が未指定/未登録の場合は一般表記(μm)のみを返す（generic 相当、docs/11 §4）。
 */
export const GRINDERS: readonly GrinderSpec[] = [
  delonghiKg521,
  comandanteC40,
  zpressoKUltra,
  timemoreC3,
  kingrinderK6,
];

const GRINDER_BY_ID = new Map(GRINDERS.map((g) => [g.id, g]));

export function getGrinder(id: string): GrinderSpec | undefined {
  return GRINDER_BY_ID.get(id);
}

export { comandanteC40, delonghiKg521, kingrinderK6, timemoreC3, zpressoKUltra };
