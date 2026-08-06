import { ORIGIN_PROFILES } from '../data/origins';

export type OriginAdjustment = {
  /** 目標EYへの加算(%)。マッチした産地の単純平均（ブレンドは等重み） */
  deltaEy: number;
  /** 湯温への加算(°C)。マッチした産地の単純平均（ブレンドは等重み） */
  tempOffsetC: number;
  /** マッチした産地の表示名（Rationale表示用） */
  matchedNames: string[];
  /** サジェスト一覧に一致しなかった入力（そのまま warnings 表示用） */
  unmatchedRaw: string[];
};

const NO_ADJUSTMENT: OriginAdjustment = {
  deltaEy: 0,
  tempOffsetC: 0,
  matchedNames: [],
  unmatchedRaw: [],
};

/**
 * 自由入力の産地文字列を ORIGIN_PROFILES と部分一致(大小文字無視)でゆるく同定する。
 * 「エチオピア イルガチェフェ」のような複合表記でも代表産地に一致すればマッチ扱いにする。
 */
function matchOriginProfile(raw: string) {
  const normalized = raw.trim().toLowerCase();
  if (!normalized) return undefined;
  return ORIGIN_PROFILES.find((profile) =>
    profile.aliases.some((alias) => normalized.includes(alias.toLowerCase())),
  );
}

/**
 * 産地(複数可・ブレンド対応)から目標EY/湯温への補正を算出する（docs/10 §5-(2), §5-(4)）。
 * 複数産地がマッチした場合は等重みの単純平均とする（配合比はスキーマ上持たないため）。
 * どの産地にも一致しない入力は補正に使わず、呼び出し側で warnings に出せるよう返す。
 */
export function computeOriginAdjustment(origins: string[]): OriginAdjustment {
  if (origins.length === 0) return NO_ADJUSTMENT;

  const matchedNames: string[] = [];
  const unmatchedRaw: string[] = [];
  let deltaEySum = 0;
  let tempOffsetCSum = 0;

  for (const raw of origins) {
    const profile = matchOriginProfile(raw);
    if (!profile) {
      if (raw.trim()) unmatchedRaw.push(raw.trim());
      continue;
    }
    matchedNames.push(profile.name);
    deltaEySum += profile.deltaEy;
    tempOffsetCSum += profile.tempOffsetC;
  }

  if (matchedNames.length === 0) {
    return { ...NO_ADJUSTMENT, unmatchedRaw };
  }

  return {
    deltaEy: deltaEySum / matchedNames.length,
    tempOffsetC: tempOffsetCSum / matchedNames.length,
    matchedNames,
    unmatchedRaw,
  };
}
