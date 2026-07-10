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
  // 浮動小数点誤差の混入を防ぐため小数点2桁に丸める（例: 1.41 + 0.35 は 1.7599999999999998 になりうる）
  return Math.round((targetTds + 0.35) * 100) / 100;
}

export function applyIcedGrindAdjustment(micron: number): number {
  return micron - 40;
}

export function applyIcedTempAdjustment(tempC: number): number {
  return Math.min(97, tempC + 1);
}
