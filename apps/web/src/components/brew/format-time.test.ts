import { describe, expect, it } from 'vitest';
import { formatTime } from './format-time';

describe('formatTime', () => {
  it('1時間未満は m:ss で表示する', () => {
    expect(formatTime(65)).toBe('1:05');
    expect(formatTime(0)).toBe('0:00');
  });

  it('1時間以上は h:mm:ss で表示する（コールドブリューの長時間抽出向け）', () => {
    expect(formatTime(3600)).toBe('1:00:00');
    expect(formatTime(36125)).toBe('10:02:05');
  });
});
