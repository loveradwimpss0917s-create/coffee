import { describe, expect, it } from 'vitest';
import { computeOriginAdjustment } from '../../src/core/origin';

describe('computeOriginAdjustment', () => {
  it('産地未指定なら補正なし', () => {
    const result = computeOriginAdjustment([]);
    expect(result.deltaEy).toBe(0);
    expect(result.tempOffsetC).toBe(0);
    expect(result.matchedNames).toEqual([]);
    expect(result.unmatchedRaw).toEqual([]);
  });

  it('既知の産地(日本語表記)にマッチする', () => {
    const result = computeOriginAdjustment(['エチオピア']);
    expect(result.matchedNames).toEqual(['エチオピア']);
    expect(result.deltaEy).not.toBe(0);
    expect(result.unmatchedRaw).toEqual([]);
  });

  it('複合表記(産地+農園名など)でも部分一致でマッチする', () => {
    const result = computeOriginAdjustment(['エチオピア イルガチェフェ ゲデブ']);
    expect(result.matchedNames).toEqual(['エチオピア']);
  });

  it('英語表記・別名(alias)でもマッチする', () => {
    const result = computeOriginAdjustment(['Yirgacheffe']);
    expect(result.matchedNames).toEqual(['エチオピア']);
  });

  it('未知の産地は補正されず unmatchedRaw に記録される', () => {
    const result = computeOriginAdjustment(['謎の産地X']);
    expect(result.matchedNames).toEqual([]);
    expect(result.deltaEy).toBe(0);
    expect(result.tempOffsetC).toBe(0);
    expect(result.unmatchedRaw).toEqual(['謎の産地X']);
  });

  it('空文字は unmatchedRaw に含めない', () => {
    const result = computeOriginAdjustment(['  ']);
    expect(result.unmatchedRaw).toEqual([]);
  });

  it('ブレンド(複数産地)は等重みの平均になる', () => {
    const ethiopia = computeOriginAdjustment(['エチオピア']);
    const brazil = computeOriginAdjustment(['ブラジル']);
    const blend = computeOriginAdjustment(['エチオピア', 'ブラジル']);
    expect(blend.matchedNames).toEqual(['エチオピア', 'ブラジル']);
    expect(blend.deltaEy).toBeCloseTo((ethiopia.deltaEy + brazil.deltaEy) / 2, 10);
    expect(blend.tempOffsetC).toBeCloseTo((ethiopia.tempOffsetC + brazil.tempOffsetC) / 2, 10);
  });

  it('マッチした産地と未知の産地が混在しても、マッチした分だけ平均する', () => {
    const result = computeOriginAdjustment(['エチオピア', '謎の産地Y']);
    const ethiopiaOnly = computeOriginAdjustment(['エチオピア']);
    expect(result.deltaEy).toBeCloseTo(ethiopiaOnly.deltaEy, 10);
    expect(result.matchedNames).toEqual(['エチオピア']);
    expect(result.unmatchedRaw).toEqual(['謎の産地Y']);
  });

  it('大文字・小文字を無視してマッチする', () => {
    const result = computeOriginAdjustment(['ETHIOPIA']);
    expect(result.matchedNames).toEqual(['エチオピア']);
  });
});
