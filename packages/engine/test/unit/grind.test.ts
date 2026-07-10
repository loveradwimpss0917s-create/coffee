import { describe, expect, it } from 'vitest';
import {
  buildGrindResult,
  computeTargetGrindMicron,
  convertMicronToSetting,
  micronToGeneralLabel,
} from '../../src/core/grind';
import { harioV60 } from '../../src/data/drippers/hario-v60';
import { zpressoKUltra } from '../../src/data/grinders/1zpresso-k-ultra';
import { comandanteC40 } from '../../src/data/grinders/comandante-c40';
import { delonghiKg521 } from '../../src/data/grinders/delonghi-kg521';
import { BALANCED_TASTE_PROFILE } from '../../src/schemas/taste';

describe('micronToGeneralLabel', () => {
  it('閾値どおりのラベルを返す', () => {
    expect(micronToGeneralLabel(250)).toBe('極細挽き');
    expect(micronToGeneralLabel(450)).toBe('細挽き');
    expect(micronToGeneralLabel(650)).toBe('中細挽き');
    expect(micronToGeneralLabel(850)).toBe('中挽き');
    expect(micronToGeneralLabel(1050)).toBe('中粗挽き');
    expect(micronToGeneralLabel(1200)).toBe('粗挽き');
  });
});

describe('computeTargetGrindMicron', () => {
  it('ドリッパー範囲内に収まる', () => {
    const micron = computeTargetGrindMicron(harioV60, 250, 20.0, BALANCED_TASTE_PROFILE);
    expect(micron).toBeGreaterThanOrEqual(harioV60.grindRangeMicron[0]);
    expect(micron).toBeLessThanOrEqual(harioV60.grindRangeMicron[1]);
  });

  it('クリア感の好みを上げると粗くなる', () => {
    const base = computeTargetGrindMicron(harioV60, 250, 20.0, BALANCED_TASTE_PROFILE);
    const clear = computeTargetGrindMicron(harioV60, 250, 20.0, {
      ...BALANCED_TASTE_PROFILE,
      clarity: 2,
    });
    expect(clear).toBeGreaterThan(base);
  });
});

describe('convertMicronToSetting', () => {
  it('clicks 式（Comandante）は "N クリック" 形式', () => {
    expect(convertMicronToSetting(620, comandanteC40)).toMatch(/^\d+ クリック$/);
  });

  it('numbered 式（KG521J-M）は範囲内に収まる', () => {
    const setting = convertMicronToSetting(620, delonghiKg521);
    const value = Number(setting.replace('目盛 ', ''));
    expect(value).toBeGreaterThanOrEqual(
      delonghiKg521.adjustment.type === 'numbered' ? delonghiKg521.adjustment.minSetting : 0,
    );
    expect(value).toBeLessThanOrEqual(
      delonghiKg521.adjustment.type === 'numbered' ? delonghiKg521.adjustment.maxSetting : 100,
    );
  });

  it('rotations 式（1Zpresso）は "N周 + Mクリック" 形式', () => {
    expect(convertMicronToSetting(620, zpressoKUltra)).toMatch(/クリック$/);
  });

  it('calibrationOffset で結果が変化する', () => {
    const withoutOffset = convertMicronToSetting(620, comandanteC40, 0);
    const withOffset = convertMicronToSetting(620, comandanteC40, 5);
    expect(withOffset).not.toBe(withoutOffset);
  });
});

describe('buildGrindResult', () => {
  it('grinder 未指定時は setting なし・一般表記のみ', () => {
    const result = buildGrindResult(620, undefined, undefined);
    expect(result.setting).toBeUndefined();
    expect(result.generalLabel).toContain('中細挽き');
  });

  it('grinder 指定時は confidence が伝播する', () => {
    const result = buildGrindResult(620, delonghiKg521, undefined);
    expect(result.confidence).toBe('estimated');
  });
});
