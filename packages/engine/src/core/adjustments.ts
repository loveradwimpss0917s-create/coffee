/**
 * Iced（急冷式）対応の補正ルール（docs/10 §7）。
 * 仕上がり湯量の一部を氷に置き換えるため、希釈を見越して濃く・細かく・熱く作る。
 */
const ICE_RATIO = 0.35;

export type IcedWaterSplit = {
  /** ケトルから注ぐ実際の湯量 */
  brewWaterG: number;
  /** サーバーに先に入れる氷の量 */
  iceG: number;
};

export function computeIcedWaterSplit(waterG: number): IcedWaterSplit {
  const iceG = Math.round(waterG * ICE_RATIO);
  const brewWaterG = waterG - iceG;
  return { brewWaterG, iceG };
}

export function applyIcedTdsAdjustment(targetTds: number): number {
  return targetTds + 0.35;
}

export function applyIcedGrindAdjustment(micron: number): number {
  return micron - 40;
}

export function applyIcedTempAdjustment(tempC: number): number {
  return Math.min(97, tempC + 1);
}
