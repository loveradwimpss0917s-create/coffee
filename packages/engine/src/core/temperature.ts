import type { Process, RoastLevel } from '../schemas/input';
import type { TasteProfile } from '../schemas/taste';
import { clamp } from './pours';

/**
 * 湯温モデル（docs/10 §5-(4)）。
 * 焙煎度が深いほど多孔質で溶けやすいため低温に、浅いほど高温に振る。
 * ナチュラル/嫌気性は発酵由来フレーバーが強く出るため、やや低温で整える。
 */
const BASE_TEMP_BY_ROAST: Record<RoastLevel, number> = {
  light: 94,
  'medium-light': 92,
  medium: 90,
  'medium-dark': 87,
  dark: 84,
};

const PROCESS_OFFSET: Partial<Record<Process, number>> = {
  natural: -1.5,
  anaerobic: -1.5,
  honey: -0.5,
};

const LIGHT_ROASTS: RoastLevel[] = ['light', 'medium-light'];

export function computeTemperatureC(
  roastLevel: RoastLevel,
  process: Process,
  taste: TasteProfile,
  dripperTempOffsetC: number,
  daysOffRoast: number | undefined,
): number {
  let tempC = BASE_TEMP_BY_ROAST[roastLevel];
  tempC += PROCESS_OFFSET[process] ?? 0;
  tempC += taste.bitterness * 1.2 - taste.clarity * 0.8;
  if (LIGHT_ROASTS.includes(roastLevel)) {
    tempC += taste.acidity * 0.6;
  }
  tempC += dripperTempOffsetC;

  if (daysOffRoast !== undefined) {
    if (daysOffRoast < 5) tempC -= 1;
    else if (daysOffRoast > 30) tempC += 1;
  }

  tempC = clamp(tempC, 78, 97);
  return Math.round(tempC * 2) / 2; // 0.5°C 刻み
}
